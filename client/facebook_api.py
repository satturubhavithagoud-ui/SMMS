import os
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


def publish_facebook_photo(page_id, caption, image_file, access_token):
    url = f'{GRAPH_API_BASE_URL}/{page_id}/photos'
    files = {'source': image_file} if image_file is not None else {}
    data = {
        'caption': caption,
        'access_token': access_token,
    }
    response = requests.post(url, data=data, files=files, timeout=30)
    _raise_for_status_with_body(response)
    return response.json()


def publish_facebook_text(page_id, caption, access_token):
    url = f'{GRAPH_API_BASE_URL}/{page_id}/feed'
    data = {
        'message': caption,
        'access_token': access_token,
    }
    response = requests.post(url, data=data, timeout=30)
    _raise_for_status_with_body(response)
    return response.json()


def _raise_for_status_with_body(response):
    try:
        response.raise_for_status()
    except requests.HTTPError as error:
        body = response.text
        raise requests.HTTPError(f'{error} - response body: {body}') from error


def publish_instagram_media(ig_user_id, image_url, caption, access_token):
    if not image_url:
        raise ValueError('Instagram publishing requires a public image URL.')

    if 'localhost' in image_url or '127.0.0.1' in image_url:
        raise ValueError(
            'Instagram requires a publicly reachable image URL. Localhost URLs will not work for Instagram publishing.'
        )

    create_url = f'{GRAPH_API_BASE_URL}/{ig_user_id}/media'
    create_data = {
        'image_url': image_url,
        'caption': caption,
        'access_token': access_token,
    }
    create_response = requests.post(create_url, data=create_data, timeout=30)
    _raise_for_status_with_body(create_response)
    container_id = create_response.json().get('id')
    if not container_id:
        raise ValueError(f'Failed to create Instagram media container. Response: {create_response.text}')

    publish_url = f'{GRAPH_API_BASE_URL}/{ig_user_id}/media_publish'
    publish_data = {
        'creation_id': container_id,
        'access_token': access_token,
    }
    publish_response = requests.post(publish_url, data=publish_data, timeout=30)
    _raise_for_status_with_body(publish_response)
    return publish_response.json()


def publish_social_post(post, platform_name, account, media_url=None):
    platform_name = platform_name.upper()

    access_token = None
    account_id = None

    if account is not None:
        if platform_name == 'INSTAGRAM':
            access_token = getattr(account, 'page_access_token', None) or getattr(account, 'access_token', None)
            account_id = getattr(account, 'instagram_business_account_id', None)
        else:
            access_token = getattr(account, 'access_token', None)
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

    if platform_name == 'FACEBOOK':
        if post.media:
            return publish_facebook_photo(account_id, post.caption, post.media.file, access_token)
        return publish_facebook_text(account_id, post.caption, access_token)

    if platform_name == 'INSTAGRAM':
        return publish_instagram_media(account_id, media_url, post.caption, access_token)

    raise NotImplementedError(f'Graph API publishing is not implemented for {platform_name}')
