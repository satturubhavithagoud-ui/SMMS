import json
import mimetypes
import os
import requests
from django.conf import settings
from django.utils import timezone

def refresh_google_token(client_id, client_secret, refresh_token):
    url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    response = requests.post(url, data=payload, timeout=30)
    response.raise_for_status()
    return response.json()


def get_fresh_youtube_token(account):
    """
    Checks if access token is expired or close to expiry (within 5 minutes)
    and refreshes it using refresh_token if necessary.
    """
    if not account.refresh_token:
        # Fallback to current access_token if no refresh token exists
        return account.access_token

    is_expired = False
    if account.token_expiry:
        # Google tokens typically expire in 3600 seconds. Check if expired or within 5 mins.
        if account.token_expiry <= timezone.now() + timezone.timedelta(minutes=5):
            is_expired = True
    else:
        # If no expiry is stored, assume it might need a refresh or try to use current
        is_expired = False

    if is_expired:
        try:
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
            client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
            if not client_id or not client_secret:
                raise ValueError("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured in settings.")
                
            refresh_data = refresh_google_token(client_id, client_secret, account.refresh_token)
            account.access_token = refresh_data["access_token"]
            expires_in = refresh_data.get("expires_in", 3600)
            account.token_expiry = timezone.now() + timezone.timedelta(seconds=expires_in)
            account.save()
        except Exception as e:
            print(f"[ERROR] Failed to refresh Google OAuth token for account {account.id}: {e}")
            
    return account.access_token


def upload_youtube_video(title, description, file_path, access_token, tags=None):
    """
    Uploads a video to YouTube using a multipart/related POST request to Google APIs.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Video file not found at path: {file_path}")

    url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Guess MIME type
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "video/mp4"

    # Construct Metadata JSON
    snippet = {
        "title": title[:100],  # YouTube title limit is 100 characters
        "description": description,
        "categoryId": "22"  # "People & Blogs" (a sensible default category)
    }

    if tags:
        if isinstance(tags, str):
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            if tag_list:
                snippet["tags"] = tag_list
        elif isinstance(tags, list):
            snippet["tags"] = tags

    metadata = {
        "snippet": snippet,
        "status": {
            "privacyStatus": "public"  # Options: public, private, unlisted
        }
    }

    boundary = "youtube_upload_multipart_boundary"
    headers["Content-Type"] = f"multipart/related; boundary={boundary}"

    # Read binary video content
    with open(file_path, "rb") as video_file:
        video_data = video_file.read()

    # Build multipart request body
    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{json.dumps(metadata)}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: {mime_type}\r\n\r\n"
    ).encode("utf-8") + video_data + f"\r\n--{boundary}--\r\n".encode("utf-8")

    # Send POST request
    response = requests.post(url, data=body, headers=headers, timeout=300) # Give it 5 minutes for larger uploads
    
    # Handle response errors with body details
    try:
        response.raise_for_status()
    except requests.HTTPError as error:
        try:
            error_data = response.json()
            errors = error_data.get("error", {}).get("errors", [])
            for err in errors:
                if err.get("reason") == "youtubeSignupRequired":
                    raise ValueError(
                        "YouTube channel not found. Please log in to YouTube in your web browser "
                        "and create a channel for this Google account before attempting to publish videos."
                    )
        except (json.JSONDecodeError, AttributeError):
            pass
        raise requests.HTTPError(f"{error} - response body: {response.text}") from error

    return response.json()


def upload_youtube_thumbnail(video_id, thumbnail_file_path, access_token):
    """
    Sets a custom thumbnail for a YouTube video.
    """
    if not os.path.exists(thumbnail_file_path):
        raise FileNotFoundError(f"Thumbnail file not found at path: {thumbnail_file_path}")

    url = f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={video_id}&uploadType=media"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Guess MIME type
    mime_type, _ = mimetypes.guess_type(thumbnail_file_path)
    if not mime_type:
        mime_type = "image/jpeg"

    headers["Content-Type"] = mime_type

    with open(thumbnail_file_path, "rb") as f:
        data = f.read()

    response = requests.post(url, headers=headers, data=data, timeout=60)
    
    try:
        response.raise_for_status()
    except requests.HTTPError as error:
        raise requests.HTTPError(f"Failed to set YouTube thumbnail: {error} - response body: {response.text}") from error

    return response.json()


def fetch_youtube_channel_analytics(account):
    """
    Fetch YouTube channel-level analytics: subscriber count, total views,
    video count, and recent video performance metrics.
    Returns the same shape as fetch_instagram_account_analytics / fetch_facebook_page_analytics.
    """
    access_token = get_fresh_youtube_token(account)
    if not access_token:
        raise ValueError('YouTube account missing access token.')

    # 1. Channel statistics
    channels_url = 'https://www.googleapis.com/youtube/v3/channels'
    channels_params = {
        'part': 'snippet,statistics',
        'mine': 'true',
        'access_token': access_token,
    }
    channels_response = requests.get(channels_url, params=channels_params, timeout=30)
    channels_response.raise_for_status()
    channels_data = channels_response.json()

    channel = {}
    if channels_data.get('items'):
        channel = channels_data['items'][0]

    snippet = channel.get('snippet', {})
    statistics = channel.get('statistics', {})

    channel_id = channel.get('id') or getattr(account, 'account_id', '')
    channel_title = snippet.get('title') or getattr(account, 'account_username', '')
    subscriber_count = int(statistics.get('subscriberCount', 0))
    total_view_count = int(statistics.get('viewCount', 0))
    video_count = int(statistics.get('videoCount', 0))

    # 2. Recent videos (up to 12)
    search_url = 'https://www.googleapis.com/youtube/v3/search'
    search_params = {
        'part': 'snippet',
        'channelId': channel_id,
        'order': 'date',
        'maxResults': '12',
        'type': 'video',
        'access_token': access_token,
    }
    recent_media = []
    recent_likes = 0
    recent_comments = 0
    recent_views = 0

    try:
        search_response = requests.get(search_url, params=search_params, timeout=30)
        search_response.raise_for_status()
        search_data = search_response.json()

        video_ids = [
            item['id']['videoId']
            for item in search_data.get('items', [])
            if item.get('id', {}).get('videoId')
        ]

        if video_ids:
            videos_url = 'https://www.googleapis.com/youtube/v3/videos'
            videos_params = {
                'part': 'snippet,statistics',
                'id': ','.join(video_ids),
                'access_token': access_token,
            }
            videos_response = requests.get(videos_url, params=videos_params, timeout=30)
            videos_response.raise_for_status()
            videos_data = videos_response.json()

            for item in videos_data.get('items', []):
                vid_snippet = item.get('snippet', {})
                vid_stats = item.get('statistics', {})
                like_count = int(vid_stats.get('likeCount', 0))
                comment_count = int(vid_stats.get('commentCount', 0))
                view_count = int(vid_stats.get('viewCount', 0))
                recent_likes += like_count
                recent_comments += comment_count
                recent_views += view_count
                recent_media.append({
                    'id': item.get('id'),
                    'caption': vid_snippet.get('title', ''),
                    'timestamp': vid_snippet.get('publishedAt'),
                    'media_type': 'VIDEO',
                    'permalink': f'https://www.youtube.com/watch?v={item.get("id")}',
                    'like_count': like_count,
                    'comments_count': comment_count,
                    'view_count': view_count,
                    'engagement_total': like_count + comment_count,
                })
    except Exception as e:
        if settings.DEBUG:
            print(f'[DEBUG] YouTube recent videos lookup error: {e}')

    return {
        'platform': 'youtube',
        'label': 'YouTube',
        'account_name': channel_title,
        'page_link': f'https://www.youtube.com/channel/{channel_id}' if channel_id else None,
        'metrics': {
            'followers_count': subscriber_count,
            'fan_count': subscriber_count,
            'total_views': total_view_count,
            'video_count': video_count,
            'recent_media_count': len(recent_media),
            'recent_likes': recent_likes,
            'recent_comments': recent_comments,
            'recent_views': recent_views,
            'recent_engagement_total': recent_likes + recent_comments,
        },
        'recent_media': recent_media,
    }
