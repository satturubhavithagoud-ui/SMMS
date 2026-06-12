import json
import os
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from client.models import Client as SMMSClient, Platform, SocialMediaAccount, Post
from client.youtube_api import get_fresh_youtube_token, upload_youtube_video, upload_youtube_thumbnail

class YouTubeIntegrationTests(TestCase):
    def setUp(self):
        # Create standard test client
        from django.contrib.auth.models import User
        self.django_user = User.objects.create_user(
            username="testclient",
            email="test@client.com",
            password="testpassword"
        )
        self.client_user = SMMSClient.objects.create(
            user=self.django_user,
            organization_name="Test Client Org"
        )
        self.youtube_platform, _ = Platform.objects.get_or_create(
            name="YOUTUBE"
        )
        # Create a social media account representing connected YouTube channel
        self.account = SocialMediaAccount.objects.create(
            client=self.client_user,
            platform=self.youtube_platform,
            account_id="youtube_channel_123",
            account_username="Test Channel Name",
            access_token="old_access_token",
            refresh_token="test_refresh_token",
            token_expiry=timezone.now() - timezone.timedelta(hours=1),
            is_active=True
        )

    @patch('client.views.getattr')
    def test_oauth_initiate_youtube(self, mock_getattr):
        # Mock settings values
        def side_effect(obj, name, default=None):
            if name == 'GOOGLE_CLIENT_ID':
                return 'mock_google_id'
            if name == 'GOOGLE_REDIRECT_URI':
                return 'http://127.0.0.1:8000/api/oauth/callback/'
            return getattr(settings, name, default) if hasattr(settings, name) else default
        mock_getattr.side_effect = side_effect

        client = Client()
        response = client.post(
            '/api/oauth/initiate/',
            data=json.dumps({
                "platform": "YOUTUBE",
                "client_id": self.client_user.id
            }),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("auth_url", data)
        self.assertIn("client_id=mock_google_id", data["auth_url"])
        self.assertIn("prompt=consent", data["auth_url"])
        self.assertIn("access_type=offline", data["auth_url"])

    @patch('client.views.cache')
    @patch('requests.post')
    @patch('requests.get')
    def test_oauth_callback_youtube(self, mock_get, mock_post, mock_cache):
        # Mock Cache verification
        mock_cache.get.return_value = {
            "platform": "YOUTUBE",
            "client_id": self.client_user.id
        }

        # Mock Token Response
        mock_token_resp = MagicMock()
        mock_token_resp.status_code = 200
        mock_token_resp.json.return_value = {
            "access_token": "new_access_token_123",
            "refresh_token": "new_refresh_token_123",
            "expires_in": 3600
        }
        mock_post.return_value = mock_token_resp

        # Mock Channel lookup response
        mock_channel_resp = MagicMock()
        mock_channel_resp.status_code = 200
        mock_channel_resp.json.return_value = {
            "items": [
                {
                    "id": "youtube_channel_789",
                    "snippet": {
                        "title": "Configured YouTube Channel Title"
                    }
                }
            ]
        }
        mock_get.return_value = mock_channel_resp

        client = Client()
        response = client.post(
            '/api/oauth/callback/',
            data=json.dumps({
                "code": "test_auth_code",
                "state": "youtube:state123"
            }),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["account"], "Configured YouTube Channel Title")

        # Verify database record updated
        updated_account = SocialMediaAccount.objects.get(id=self.account.id)
        self.assertEqual(updated_account.access_token, "new_access_token_123")
        self.assertEqual(updated_account.refresh_token, "new_refresh_token_123")
        self.assertEqual(updated_account.account_id, "youtube_channel_789")
        self.assertEqual(updated_account.account_username, "Configured YouTube Channel Title")

    @patch('client.youtube_api.refresh_google_token')
    def test_token_refresh_helper(self, mock_refresh):
        mock_refresh.return_value = {
            "access_token": "freshly_refreshed_token",
            "expires_in": 3600
        }
        
        # Call fresh token getter (current token is expired in setUp)
        token = get_fresh_youtube_token(self.account)
        self.assertEqual(token, "freshly_refreshed_token")
        
        # Verify db updated
        self.account.refresh_from_db()
        self.assertEqual(self.account.access_token, "freshly_refreshed_token")

    @patch('requests.post')
    def test_youtube_video_upload_api(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "youtube_video_id_999",
            "snippet": {
                "title": "Uploaded Test Video"
            }
        }
        mock_post.return_value = mock_response

        # Create dummy file to upload
        dummy_file_path = "test_video.mp4"
        with open(dummy_file_path, "wb") as f:
            f.write(b"fake_video_bytes")

        try:
            res = upload_youtube_video(
                title="Uploaded Test Video",
                description="Testing multipart upload helper",
                file_path=dummy_file_path,
                access_token="valid_token"
            )
            self.assertEqual(res["id"], "youtube_video_id_999")
        finally:
            if os.path.exists(dummy_file_path):
                os.remove(dummy_file_path)

    @patch('requests.post')
    def test_youtube_thumbnail_upload_api(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "url": "https://i.ytimg.com/vi/youtube_video_id_999/default.jpg"
        }
        mock_post.return_value = mock_response

        # Create dummy thumbnail image
        dummy_thumb_path = "test_thumbnail.jpg"
        with open(dummy_thumb_path, "wb") as f:
            f.write(b"fake_image_bytes")

        try:
            res = upload_youtube_thumbnail(
                video_id="youtube_video_id_999",
                thumbnail_file_path=dummy_thumb_path,
                access_token="valid_token"
            )
            self.assertIn("url", res)
        finally:
            if os.path.exists(dummy_thumb_path):
                os.remove(dummy_thumb_path)

    @patch('client.youtube_api.upload_youtube_video')
    @patch('client.youtube_api.upload_youtube_thumbnail')
    @patch('client.youtube_api.get_fresh_youtube_token')
    def test_youtube_thumbnail_forbidden_handling(self, mock_get_token, mock_upload_thumb, mock_upload_video):
        from client.models import PostPlatform
        mock_get_token.return_value = "fake_fresh_token"
        mock_upload_video.return_value = {"id": "video_123"}
        
        # Mock permission error
        mock_upload_thumb.side_effect = Exception("403 Forbidden - custom video thumbnails permissions required")

        # Let's import publish_social_post
        from client.facebook_api import publish_social_post
        
        # Create dummy file to satisfy media checks
        dummy_file_path = "test_video.mp4"
        with open(dummy_file_path, "wb") as f:
            f.write(b"fake_video_bytes")
            
        post = Post.objects.create(
            caption="test video caption",
            title="test video title",
            media=dummy_file_path,
            created_by_role='SMH'
        )
        pp = PostPlatform.objects.create(
            post=post,
            platform=self.youtube_platform,
            platform_metadata={"thumbnail_path": "/media/thumb.jpg"}
        )

        try:
            res = publish_social_post(
                post=post,
                platform_name="YOUTUBE",
                account=self.account,
                media_url="/media/test.mp4",
                post_platform=pp
            )

            # It should succeed instead of raising exception, and return a dictionary containing the warning
            self.assertEqual(res["id"], "video_123")
            self.assertIn("thumbnail_warning", res)
            self.assertIn("not verified for custom thumbnails", res["thumbnail_warning"])
        finally:
            if os.path.exists(dummy_file_path):
                os.remove(dummy_file_path)

    @patch('client.youtube_analytics.requests.get')
    @patch('client.youtube_api.get_fresh_youtube_token')
    def test_youtube_analytics_view_success(self, mock_get_token, mock_get):
        mock_get_token.return_value = "fresh_oauth_token"
        
        # Mock successful YouTube Analytics response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "columnHeaders": [
                {"name": "views"},
                {"name": "likes"},
                {"name": "comments"},
                {"name": "shares"},
                {"name": "subscribersGained"},
                {"name": "estimatedMinutesWatched"}
            ],
            "rows": [[1000, 50, 10, 5, 20, 2500]]
        }
        mock_get.return_value = mock_response

        client = Client()
        response = client.get(f'/api/analytics/youtube/?client_id={self.client_user.id}')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["metrics"]["views"], 1000)
        self.assertEqual(data["metrics"]["likes"], 50)
        self.assertEqual(data["metrics"]["subscribersGained"], 20)

    def test_youtube_analytics_view_missing_client(self):
        client = Client()
        response = client.get('/api/analytics/youtube/')
        self.assertEqual(response.status_code, 400)


# =========================================================
# FACEBOOK & INSTAGRAM ANALYTICS TESTS
# =========================================================

from types import SimpleNamespace
from unittest.mock import patch, MagicMock
from django.test import override_settings
import requests
from client.facebook_api import fetch_facebook_page_analytics, publish_social_post
from client.views import oauth_callback_view, fetch_page_with_ig


class FacebookApiTests(TestCase):
    def test_fetch_facebook_page_analytics_falls_back_to_user_token_when_metrics_missing(self):
        account = SimpleNamespace(
            account_id='page-123',
            account_username='Page Name',
            access_token='user-token',
            page_access_token='page-token',
        )

        with patch('client.facebook_api._graph_get') as graph_get:
            graph_get.side_effect = [
                {
                    'id': 'page-123',
                    'name': 'Page Name',
                    'link': 'https://facebook.com/page-123',
                },
                {
                    'id': 'page-123',
                    'name': 'Page Name',
                    'link': 'https://facebook.com/page-123',
                    'followers_count': 27,
                    'fan_count': 25,
                },
                {'data': []},
                {'data': []},
            ]

            analytics = fetch_facebook_page_analytics(account)

        self.assertEqual(analytics['metrics']['followers_count'], 27)
        self.assertEqual(analytics['metrics']['fan_count'], 25)
        self.assertEqual(graph_get.call_count, 3)
        self.assertEqual(graph_get.call_args_list[0].args[0], 'page-123')
        self.assertEqual(graph_get.call_args_list[0].args[1]['access_token'], 'page-token')
        self.assertEqual(graph_get.call_args_list[1].args[1]['access_token'], 'user-token')

    def test_publish_social_post_prefers_page_access_token_for_facebook(self):
        post = SimpleNamespace(caption='Hello Facebook', media=None)
        account = SimpleNamespace(
            account_id='page-123',
            access_token='user-token',
            page_access_token='page-token',
        )

        with patch('client.facebook_api.publish_facebook_text') as publish_facebook_text:
            publish_social_post(post, 'FACEBOOK', account)

        publish_facebook_text.assert_called_once_with('page-123', 'Hello Facebook', 'page-token', metadata={})

    def test_fetch_facebook_page_analytics_adds_warning_when_post_endpoint_is_blocked(self):
        account = SimpleNamespace(
            account_id='page-123',
            account_username='Page Name',
            access_token='user-token',
            page_access_token='page-token',
        )

        with patch('client.facebook_api._graph_get') as graph_get:
            graph_get.side_effect = [
                {
                    'id': 'page-123',
                    'name': 'Page Name',
                    'link': 'https://facebook.com/page-123',
                    'followers_count': 7,
                    'fan_count': 9,
                },
                requests.HTTPError('(#10) This endpoint requires the pages_read_engagement permission'),
                requests.HTTPError('(#10) This endpoint requires the pages_read_engagement permission'),
            ]

            analytics = fetch_facebook_page_analytics(account)

        self.assertEqual(analytics['metrics']['followers_count'], 7)
        self.assertEqual(analytics['metrics']['fan_count'], 9)
        self.assertEqual(analytics['metrics']['recent_likes'], 0)
        self.assertTrue(analytics['warnings'])


class OAuthCallbackViewTests(TestCase):
    def setUp(self):
        from django.test import RequestFactory
        self.factory = RequestFactory()
        from django.contrib.auth.models import User
        self.user = User.objects.create_user(username='client-user-fb', password='secret-fb')
        self.client_profile = SMMSClient.objects.create(user=self.user, organization_name='Test Org FB')
        self.platform = Platform.objects.create(name='FACEBOOK')

    @override_settings(
        FACEBOOK_APP_ID='app-id',
        FACEBOOK_APP_SECRET='app-secret',
        FACEBOOK_REDIRECT_URI='http://localhost:8000/api/oauth/callback/',
        FACEBOOK_GRAPH_API_VERSION='v17.0',
        FRONTEND_BASE_URL='http://localhost:5174',
    )
    @patch('client.views.requests.get')
    def test_oauth_callback_preserves_user_token_and_page_token(self, mock_get):
        state = 'FACEBOOK:test-state'
        cache.set(
            f'oauth_state_{state}',
            {'platform': 'FACEBOOK', 'client_id': self.client_profile.id},
            timeout=600,
        )

        token_response = MagicMock()
        token_response.raise_for_status = MagicMock()
        token_response.json.return_value = {
            'access_token': 'user-token',
            'expires_in': 3600,
        }

        pages_response = MagicMock()
        pages_response.status_code = 200
        pages_response.json.return_value = {
            'data': [
                {
                    'id': 'page-123',
                    'name': 'Page Name',
                    'access_token': 'page-token',
                }
            ]
        }

        mock_get.side_effect = [token_response, pages_response]

        request = self.factory.post(
            '/api/oauth/callback/',
            data=json.dumps({'code': 'auth-code', 'state': state}),
            content_type='application/json',
        )

        response = oauth_callback_view(request)

        self.assertEqual(response.status_code, 200)
        account = SocialMediaAccount.objects.get(client=self.client_profile, platform=self.platform)
        self.assertEqual(account.access_token, 'user-token')
        self.assertEqual(account.page_access_token, 'page-token')
        self.assertEqual(account.account_id, 'page-123')
