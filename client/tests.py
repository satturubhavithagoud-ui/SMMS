import json
from types import SimpleNamespace
from unittest.mock import Mock, patch

import requests
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import RequestFactory, TestCase, override_settings

from client.facebook_api import fetch_facebook_page_analytics, publish_social_post
from client.models import Client, Platform, SocialMediaAccount
from client.views import oauth_callback_view


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

        publish_facebook_text.assert_called_once_with('page-123', 'Hello Facebook', 'page-token')

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
        self.factory = RequestFactory()
        self.user = User.objects.create_user(username='client-user', password='secret')
        self.client_profile = Client.objects.create(user=self.user, organization_name='Test Org')
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

        token_response = Mock()
        token_response.raise_for_status = Mock()
        token_response.json.return_value = {
            'access_token': 'user-token',
            'expires_in': 3600,
        }

        pages_response = Mock()
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
