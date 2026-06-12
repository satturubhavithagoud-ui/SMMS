import os
from celery import shared_task
from django.utils import timezone
from django.conf import settings

from .models import (
    Post,
    PostSchedule,
    PostPlatform,
    Platform,
    SocialMediaAccount
)

from .facebook_api import publish_social_post


def get_public_media_url_no_request(path):
    if not path:
        return None
    if path.startswith('http://') or path.startswith('https://'):
        return path
    
    base_url = getattr(settings, 'PUBLIC_MEDIA_BASE_URL', '')
    if base_url:
        return f"{base_url.rstrip('/')}{path}"

    ngrok_url = os.environ.get('NGROK_PUBLIC_URL') or os.environ.get('NGROK_URL')
    if ngrok_url:
        return f"{ngrok_url.rstrip('/')}{path}"

    return f"http://127.0.0.1:8000{path}"


@shared_task
def publish_scheduled_post(post_id):
    try:
        post = Post.objects.get(id=post_id)
        schedule = PostSchedule.objects.get(post=post)
        platforms = PostPlatform.objects.filter(post=post)

        any_failed = False
        failed_msgs = []

        for client in post.clients.all():
            for item in platforms:
                platform = item.platform
                social_account = SocialMediaAccount.objects.filter(
                    client=client,
                    platform=platform,
                    is_active=True
                ).first()

                if not social_account:
                    any_failed = True
                    failed_msgs.append(f"{platform.name}: Social media account missing.")
                    continue

                media_url = None
                if item.platform_media:
                    media_url = get_public_media_url_no_request(item.platform_media.url)
                elif post.media:
                    media_url = get_public_media_url_no_request(post.media.url)

                try:
                    publish_response = publish_social_post(
                        post=post,
                        platform_name=platform.name,
                        account=social_account,
                        media_url=media_url,
                        post_platform=item
                    )

                    platform_post_id = None
                    if isinstance(publish_response, dict):
                        platform_post_id = publish_response.get('id')

                    if platform_post_id:
                        meta = dict(item.platform_metadata or {})
                        meta['platform_post_id'] = str(platform_post_id)
                        item.platform_metadata = meta
                        item.save(update_fields=['platform_metadata'])

                except Exception as ex:
                    any_failed = True
                    failed_msgs.append(f"{platform.name}: {str(ex)}")

        if any_failed:
            post.status = 'FAILED'
            post.save()
            
            schedule.status = 'FAILED'
            schedule.failure_reason = "; ".join(failed_msgs)
            schedule.save()
            
            return f"Post {post.id} completed with errors: {'; '.join(failed_msgs)}"
        else:
            post.status = 'POSTED'
            post.save()

            schedule.status = 'COMPLETED'
            schedule.posted_time = timezone.now()
            schedule.save()

            return f"Post {post.id} published successfully"

    except Exception as e:
        print("CELERY GENERAL ERROR:", str(e))
        raise e