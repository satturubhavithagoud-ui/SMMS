from celery import shared_task
from django.utils import timezone

from .models import Post, PostSchedule, PostPlatform
from .facebook_api import publish_social_post


@shared_task
def publish_scheduled_post(post_id):

    try:
        post = Post.objects.get(id=post_id)

        schedule = PostSchedule.objects.get(post=post)

        platforms = PostPlatform.objects.filter(post=post)

        for item in platforms:

            platform = item.platform

            social_account = post.client.socialmediaaccount_set.filter(
                platform=platform,
                is_active=True
            ).first()

            if not social_account:
                continue

            media_url = None

            if post.media:
                media_url = post.media.url

            publish_social_post(
                post=post,
                platform_name=platform.name,
                account=social_account,
                media_url=media_url
            )

        post.status = 'POSTED'
        post.save()

        schedule.status = 'COMPLETED'
        schedule.posted_time = timezone.now()
        schedule.save()

        return f"Post {post.id} published successfully"

    except Exception as e:

        print("CELERY ERROR:", str(e))

        try:
            post.status = 'FAILED'
            post.save()
        except:
            pass

        try:
            schedule.status = 'FAILED'
            schedule.failure_reason = str(e)
            schedule.save()
        except:
            pass

        raise e