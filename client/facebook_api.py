import os
import time
import mimetypes
import requests
from django.conf import settings

GRAPH_API_VERSION = getattr(settings, 'FACEBOOK_GRAPH_API_VERSION', 'v17.0')
GRAPH_API_BASE_URL = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


def get_app_access_token():
    app_id = getattr(settings, 'FACEBOOK_APP_ID', '')
    app_secret = getattr(settings, 'FACEBOOK_APP_SECRET', '')
    if not app_id or not app_secret:
        return None
    return f'{app_id}|{app_secret}'


def publish_facebook_photo(page_id, caption, image_file, access_token, metadata=None):
    url = f'{GRAPH_API_BASE_URL}/{page_id}/photos'
    files = {'source': image_file} if image_file is not None else {}
    data = {
        'caption': caption,
        'access_token': access_token,
    }
    if metadata:
        if 'place' in metadata:
            data['place'] = metadata['place']
        if 'tags' in metadata:
            data['tags'] = metadata['tags']
    response = requests.post(url, data=data, files=files, timeout=30)
    _raise_for_status_with_body(response)
    return response.json()


def publish_facebook_video(page_id, caption, video_file, access_token, metadata=None):
    url = f'{GRAPH_API_BASE_URL}/{page_id}/videos'
    files = {'source': video_file} if video_file is not None else {}
    data = {
        'description': caption,
        'access_token': access_token,
    }
    if metadata:
        if 'title' in metadata:
            data['title'] = metadata['title']
    response = requests.post(url, data=data, files=files, timeout=120)
    _raise_for_status_with_body(response)
    return response.json()


def publish_facebook_text(page_id, caption, access_token, metadata=None):
    url = f'{GRAPH_API_BASE_URL}/{page_id}/feed'
    data = {
        'message': caption,
        'access_token': access_token,
    }
    if metadata:
        if 'link' in metadata:
            data['link'] = metadata['link']
        if 'place' in metadata:
            data['place'] = metadata['place']
        if 'tags' in metadata:
            data['tags'] = metadata['tags']
    response = requests.post(url, data=data, timeout=30)
    _raise_for_status_with_body(response)
    return response.json()


def _raise_for_status_with_body(response):
    try:
        response.raise_for_status()
    except requests.HTTPError as error:
        body = response.text
        raise requests.HTTPError(f'{error} - response body: {body}') from error


def publish_instagram_media(ig_user_id, image_url, caption, access_token, metadata=None):
    if not image_url:
        raise ValueError('Instagram publishing requires a public image URL.')

    if 'localhost' in image_url or '127.0.0.1' in image_url:
        raise ValueError(
            'Instagram requires a publicly reachable image URL. Localhost URLs will not work for Instagram publishing.'
        )

    create_url = f'{GRAPH_API_BASE_URL}/{ig_user_id}/media'
    create_data = {
        'caption': caption,
        'access_token': access_token,
    }
    
    if metadata and metadata.get('post_type') in ['Reel', 'Video']:
        create_data['media_type'] = 'REELS'
        create_data['video_url'] = image_url
        if 'share_to_feed' in metadata:
            create_data['share_to_feed'] = str(metadata['share_to_feed']).lower()
        if 'thumb_offset' in metadata:
            create_data['thumb_offset'] = metadata['thumb_offset']
    else:
        create_data['image_url'] = image_url

    if metadata:
        if 'location_id' in metadata:
            create_data['location_id'] = metadata['location_id']
        if 'user_tags' in metadata:
            create_data['user_tags'] = metadata['user_tags']
    create_response = requests.post(create_url, data=create_data, timeout=30)
    _raise_for_status_with_body(create_response)
    container_id = create_response.json().get('id')
    if not container_id:
        raise ValueError(f'Failed to create Instagram media container. Response: {create_response.text}')

    # For Reels/Videos, wait for the container processing to be finished
    is_video_post = metadata and metadata.get('post_type') in ['Reel', 'Video']
    if is_video_post:
        status_url = f'{GRAPH_API_BASE_URL}/{container_id}'
        max_attempts = 45  # 45 * 10 seconds = 7.5 minutes max wait
        for attempt in range(max_attempts):
            status_params = {
                'fields': 'status_code,status',
                'access_token': access_token
            }
            status_response = requests.get(status_url, params=status_params, timeout=30)
            _raise_for_status_with_body(status_response)
            
            status_data = status_response.json()
            status_code = status_data.get('status_code')
            
            if status_code == 'FINISHED':
                break
            elif status_code == 'ERROR':
                error_msg = status_data.get('status', 'Unknown error processing media.')
                raise ValueError(f'Instagram video processing failed: {error_msg}')
            
            time.sleep(10)
        else:
            raise TimeoutError('Instagram video processing timed out on Meta servers.')

    publish_url = f'{GRAPH_API_BASE_URL}/{ig_user_id}/media_publish'
    publish_data = {
        'creation_id': container_id,
        'access_token': access_token,
    }
    publish_response = requests.post(publish_url, data=publish_data, timeout=30)
    _raise_for_status_with_body(publish_response)
    return publish_response.json()


def publish_social_post(post, platform_name, account, media_url=None, post_platform=None):
    platform_name = platform_name.upper()

    access_token = None
    account_id = None

    if account is not None:
        if platform_name == 'INSTAGRAM':
            access_token = next(iter(_account_tokens(account, prefer_page_token=True)), None)
            account_id = getattr(account, 'instagram_business_account_id', None) or getattr(account, 'account_id', None)
        else:
            access_token = next(iter(_account_tokens(account, prefer_page_token=True)), None)
            account_id = getattr(account, 'account_id', None)

    if not access_token or not account_id:
        if platform_name == 'FACEBOOK':
            access_token = access_token or getattr(settings, 'FACEBOOK_ACCESS_TOKEN', '')
            account_id = account_id or getattr(settings, 'FACEBOOK_PAGE_ID', '')
        elif platform_name == 'INSTAGRAM':
            access_token = access_token or getattr(settings, 'INSTAGRAM_ACCESS_TOKEN', '')
            account_id = account_id or getattr(settings, 'INSTAGRAM_BUSINESS_ACCOUNT_ID', '')

    if not access_token or not account_id:
        raise ValueError('Social media account missing access token or account ID.')

    p_caption = post_platform.platform_caption if post_platform and post_platform.platform_caption else post.caption
    p_media_path = post_platform.platform_media.path if post_platform and post_platform.platform_media else (post.media.path if post.media else None)
    p_metadata = post_platform.platform_metadata if post_platform else {}
    if not isinstance(p_metadata, dict):
        p_metadata = {}

    is_video = False
    if p_media_path:
        mime_type, _ = mimetypes.guess_type(p_media_path)
        if mime_type and mime_type.startswith('video/'):
            is_video = True
        elif p_media_path.lower().endswith(('.mp4', '.mov', '.avi', '.mkv', '.3gp')):
            is_video = True

    if platform_name == 'FACEBOOK':
        if p_media_path:
            with open(p_media_path, 'rb') as media_file:
                if is_video:
                    return publish_facebook_video(
                        account_id,
                        p_caption,
                        media_file,
                        access_token,
                        metadata=p_metadata
                    )
                else:
                    return publish_facebook_photo(
                        account_id,
                        p_caption,
                        media_file,
                        access_token,
                        metadata=p_metadata
                    )
        return publish_facebook_text(account_id, p_caption, access_token, metadata=p_metadata)

    if platform_name == 'INSTAGRAM':
        if is_video:
            p_metadata['post_type'] = 'Video'
        return publish_instagram_media(account_id, media_url, p_caption, access_token, metadata=p_metadata)

    if platform_name == 'YOUTUBE':
        if not account:
            raise ValueError('Social media account missing for YouTube.')
        from .youtube_api import get_fresh_youtube_token, upload_youtube_video, upload_youtube_thumbnail
        
        fresh_access_token = get_fresh_youtube_token(account)
        
        if not p_media_path:
            raise ValueError('YouTube publishing requires a video file.')
            
        mime_type, _ = mimetypes.guess_type(p_media_path)
        if not mime_type or not mime_type.startswith('video/'):
            raise ValueError('YouTube publishing requires a video file, but the uploaded file is not a video.')
            
        video_resp = upload_youtube_video(
            title=p_metadata.get('title') or post.title or p_caption[:50] or "New Video",
            description=p_caption,
            file_path=p_media_path,
            access_token=fresh_access_token,
            tags=p_metadata.get('tags')
        )
        
        thumbnail_path = p_metadata.get('thumbnail_path')
        if thumbnail_path and video_resp.get('id'):
            try:
                upload_youtube_thumbnail(
                    video_id=video_resp['id'],
                    thumbnail_file_path=thumbnail_path,
                    access_token=fresh_access_token
                )
            except Exception as e:
                err_msg = str(e)
                if "permissions to upload" in err_msg or "custom video thumbnails" in err_msg or "403" in err_msg:
                    video_resp['thumbnail_warning'] = (
                        "Video uploaded successfully, but the custom thumbnail could not be set because "
                        "your YouTube channel is not verified for custom thumbnails. Please verify your channel "
                        "at https://www.youtube.com/verify to enable custom thumbnails."
                    )
                else:
                    raise e
            
        return video_resp

    raise NotImplementedError(f'Graph API publishing is not implemented for {platform_name}')


def _graph_get(object_path, params):
    response = requests.get(
        f'{GRAPH_API_BASE_URL}/{object_path.lstrip("/")}',
        params=params,
        timeout=30,
    )
    _raise_for_status_with_body(response)
    return response.json()


def _account_tokens(account, prefer_page_token=False):
    tokens = []
    ordered_candidates = [
        getattr(account, 'page_access_token', None),
        getattr(account, 'access_token', None),
    ]
    if not prefer_page_token:
        ordered_candidates.reverse()

    for token in ordered_candidates:
        if token and token not in tokens:
            tokens.append(token)
    return tokens


def _coerce_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def fetch_instagram_account_analytics(account, media_limit=12):
    access_token = next(iter(_account_tokens(account, prefer_page_token=True)), None)
    account_id = getattr(account, 'instagram_business_account_id', None) or getattr(account, 'account_id', None)

    if not access_token or not account_id:
        raise ValueError('Instagram account missing access token or account ID.')

    profile = _graph_get(
        account_id,
        {
            'fields': 'id,username,followers_count,media_count',
            'access_token': access_token,
        },
    )

    media_response = _graph_get(
        f'{account_id}/media',
        {
            'fields': 'id,caption,timestamp,media_type,permalink,like_count,comments_count',
            'limit': str(media_limit),
            'access_token': access_token,
        },
    )

    recent_media = []
    likes_total = 0
    comments_total = 0

    for item in media_response.get('data', []):
        like_count = int(item.get('like_count') or 0)
        comment_count = int(item.get('comments_count') or 0)
        likes_total += like_count
        comments_total += comment_count
        recent_media.append({
            'id': item.get('id'),
            'caption': item.get('caption') or '',
            'timestamp': item.get('timestamp'),
            'media_type': item.get('media_type'),
            'permalink': item.get('permalink'),
            'like_count': like_count,
            'comments_count': comment_count,
            'engagement_total': like_count + comment_count,
        })

    return {
        'platform': 'instagram',
        'label': 'Instagram',
        'account_name': profile.get('username') or getattr(account, 'account_username', ''),
        'metrics': {
            'followers_count': int(profile.get('followers_count') or 0),
            'media_count': int(profile.get('media_count') or 0),
            'recent_media_count': len(recent_media),
            'recent_likes': likes_total,
            'recent_comments': comments_total,
            'recent_engagement_total': likes_total + comments_total,
        },
        'recent_media': recent_media,
    }


def fetch_facebook_page_analytics(account):
    account_id = getattr(account, 'account_id', None)

    access_tokens = _account_tokens(account, prefer_page_token=True)

    if not access_tokens or not account_id:
        raise ValueError('Facebook page missing access token or account ID.')

    page = {}
    followers_count = None
    fan_count = None
    for access_token in access_tokens:
        try:
            page = _graph_get(
                account_id,
                {
                    'fields': 'id,name,link,followers_count,fan_count',
                    'access_token': access_token,
                },
            )
            followers_count = page.get('followers_count')
            fan_count = page.get('fan_count')
            if followers_count is not None or fan_count is not None:
                break
        except Exception:
            continue

    recent_media = []
    recent_likes = 0
    recent_comments = 0
    warnings = []
    posts_error = None

    post_fields = (
        'id,message,created_time,permalink_url,'
        'reactions.summary(true).limit(0),comments.summary(true).limit(0)'
    )
    for access_token in access_tokens:
        try:
            posts_response = _graph_get(
                f'{account_id}/posts',
                {
                    'fields': post_fields,
                    'limit': '12',
                    'access_token': access_token,
                },
            )
            for item in posts_response.get('data', []):
                reactions = _coerce_int(
                    ((item.get('reactions') or {}).get('summary') or {}).get('total_count')
                )
                comments = _coerce_int(
                    ((item.get('comments') or {}).get('summary') or {}).get('total_count')
                )
                recent_likes += reactions
                recent_comments += comments
                recent_media.append({
                    'id': item.get('id'),
                    'caption': item.get('message') or '',
                    'timestamp': item.get('created_time'),
                    'media_type': 'POST',
                    'permalink': item.get('permalink_url'),
                    'like_count': reactions,
                    'comments_count': comments,
                    'engagement_total': reactions + comments,
                })
            posts_error = None
            break
        except requests.HTTPError as error:
            posts_error = error

    if posts_error is not None:
        warnings.append(
            'Facebook post reactions are unavailable for this connection. '
            'Meta returned a permission error for page post analytics.'
        )

    return {
        'platform': 'facebook',
        'label': 'Facebook',
        'account_name': page.get('name') or getattr(account, 'account_username', ''),
        'page_link': page.get('link'),
        'metrics': {
            'followers_count': _coerce_int(followers_count),
            'fan_count': _coerce_int(fan_count),
            'recent_media_count': len(recent_media),
            'recent_likes': recent_likes,
            'recent_comments': recent_comments,
            'recent_engagement_total': recent_likes + recent_comments,
        },
        'recent_media': recent_media,
        'warnings': warnings,
    }

