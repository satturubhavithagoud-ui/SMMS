import json
import requests
import secrets
from datetime import datetime, timedelta
from urllib.parse import quote_plus
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime
from django.shortcuts import redirect
from django.urls import reverse

from .models import (
    Client,
    SMH,
    Platform,
    ClientPlatform,
    SocialMediaAccount,
    Post,
    PostPlatform,
    PostSchedule,
)
from .facebook_api import publish_social_post


def ensure_platform_records():
    platforms = []
    for value, _label in Platform.PLATFORM_CHOICES:
        platform, _created = Platform.objects.get_or_create(name=value)
        platforms.append(platform)
    return platforms


# =========================================================
# SIGNUP
# =========================================================

@csrf_exempt
def signup_view(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST method allowed"},
            status=405
        )

    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON in request body"},
                status=400
            )

        fullname = data.get("fullname")
        email = data.get("email")
        password = data.get("password")
        platforms = data.get("platforms", [])

        # -----------------------------
        # VALIDATIONS
        # -----------------------------

        if not fullname or not email or not password:
            return JsonResponse(
                {"error": "All fields are required"},
                status=400
            )

        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"error": "Email already exists"},
                status=400
            )

        # -----------------------------
        # CREATE DJANGO USER
        # username=email for authentication
        # first_name=real display username
        # -----------------------------

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=fullname
        )

        # -----------------------------
        # CREATE CLIENT PROFILE
        # -----------------------------

        client = Client.objects.create(
            user=user,
            organization_name=""
        )

        # -----------------------------
        # SAVE SELECTED PLATFORMS
        # -----------------------------

        available_platforms = {
            platform.name: platform for platform in ensure_platform_records()
        }

        for platform_name in [item.upper() for item in platforms if isinstance(item, str)]:
            platform = available_platforms.get(platform_name)
            if platform:
                ClientPlatform.objects.get_or_create(
                    client=client,
                    platform=platform
                )

        return JsonResponse({
            "message": "Signup successful",
            "username": user.first_name
        })

    except Exception as e:
        return JsonResponse({
            "error": str(e)
        }, status=500)


# =========================================================
# LOGIN
# =========================================================

@csrf_exempt
def login_view(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST method allowed"},
            status=405
        )

    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON in request body"},
                status=400
            )

        email = data.get("email")
        password = data.get("password")

        login_identifier = email
        matching_user = User.objects.filter(email=email).first()
        if matching_user:
            login_identifier = matching_user.username

        user = authenticate(
            username=login_identifier,
            password=password
        )

        if not user:
            return JsonResponse({
                "error": "Invalid credentials"
            }, status=400)

        # -----------------------------
        # CHECK ROLE
        # -----------------------------

        role = None
        client_id = None

        if Client.objects.filter(user=user).exists():
            role = "CLIENT"
            client_obj = Client.objects.filter(user=user).first()
            client_id = client_obj.id if client_obj else None

        elif SMH.objects.filter(user=user).exists():
            role = "SMH"

        else:
            role = "UNKNOWN"

        response_data = {
            "message": "Login successful",
            "user_id": user.id,
            "username": user.first_name,
            "email": user.email,
            "role": role
        }
        if client_id:
            response_data["client_id"] = client_id

        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse({
            "error": str(e)
        }, status=500)


# =========================================================
# OAUTH INITIATION
# =========================================================

@csrf_exempt
def oauth_initiate_view(request):
    """
    Initiate OAuth flow for a platform
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)
        platform_name = data.get("platform", "").upper()
        client_id = data.get("client_id")

        if not platform_name:
            return JsonResponse({"error": "Platform is required"}, status=400)

        # Get client
        client = None
        if client_id:
            client = Client.objects.filter(id=client_id).first()
        if not client:
            # Try to get from session or first client
            client = Client.objects.first()

        if not client:
            return JsonResponse({"error": "Client not found"}, status=400)

        # Generate state for CSRF protection
        state = f"{platform_name}:{secrets.token_urlsafe(32)}"

        # Store state in session for verification
        cache.set(f'oauth_state_{state}', {
    'platform': platform_name,
    'client_id': client.id
}, timeout=600)  # 10 minutes

        auth_url = None

        if platform_name == "FACEBOOK":
            app_id = getattr(settings, 'FACEBOOK_APP_ID', '')
            redirect_uri = getattr(settings, 'FACEBOOK_REDIRECT_URI', '')
            if not app_id or not redirect_uri:
                return JsonResponse({"error": "Facebook OAuth not configured"}, status=500)

            scope = "pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish"
            auth_url = (
                f"https://www.facebook.com/{settings.FACEBOOK_GRAPH_API_VERSION}/dialog/oauth?"
                f"client_id={app_id}&redirect_uri={redirect_uri}&scope={scope}&state={state}&response_type=code&auth_type=rerequest"
            )

        elif platform_name == "INSTAGRAM":
            app_id = getattr(settings, 'FACEBOOK_APP_ID', '')  # Instagram uses Facebook App
            redirect_uri = getattr(settings, 'INSTAGRAM_REDIRECT_URI', '')
            if not app_id or not redirect_uri:
                return JsonResponse({"error": "Instagram OAuth not configured"}, status=500)

            scope = "instagram_basic,instagram_content_publish,user_profile,user_media"
            auth_url = (
                f"https://www.facebook.com/{settings.FACEBOOK_GRAPH_API_VERSION}/dialog/oauth?"
                f"client_id={app_id}&redirect_uri={redirect_uri}&scope={scope}&state={state}&response_type=code"
            )

        else:
            return JsonResponse({"error": f"OAuth not supported for {platform_name}"}, status=400)

        return JsonResponse({
            "auth_url": auth_url,
            "state": state
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =========================================================
# OAUTH CALLBACK
# =========================================================

@csrf_exempt
def oauth_callback_view(request):
    """
    Handle OAuth callback and exchange code for tokens.
    Supports both GET redirects and POST requests from the frontend callback page.
    """
    if request.method not in ["GET", "POST"]:
        return JsonResponse({"error": "Only GET and POST methods allowed"}, status=405)

    try:
        if request.method == "POST":
            try:
                payload = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"success": False, "error": "Invalid JSON in request body"}, status=400)

            code = payload.get("code")
            raw_state = payload.get("state")
            error = payload.get("error")
        else:
            code = request.GET.get("code")
            raw_state = request.GET.get("state")
            error = request.GET.get("error")

        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5181')

        platform_name = ""
        if raw_state and ":" in raw_state:
            platform_name, _ = raw_state.split(":", 1)
            platform_name = platform_name.upper()

        if error:
            if request.method == "GET":
                frontend_callback_url = f"{frontend_base}/oauth/callback?error={error}"
                return redirect(frontend_callback_url)
            return JsonResponse({"success": False, "error": error}, status=400)

        if not code or not raw_state or not platform_name:
            if request.method == "GET":
                frontend_callback_url = f"{frontend_base}/oauth/callback?error=missing_parameters"
                return redirect(frontend_callback_url)
            return JsonResponse({"success": False, "error": "missing_parameters"}, status=400)

        # Verify state
        state_data = cache.get(f'oauth_state_{raw_state}')

        if not state_data:
            if request.method == "GET":
                frontend_callback_url = f"{frontend_base}/oauth/callback?error=invalid_state"
                return redirect(frontend_callback_url)
            return JsonResponse({"success": False, "error": "invalid_state"}, status=400)

        platform_name = state_data['platform']
        client_id = state_data['client_id']
        cache.delete(f'oauth_state_{raw_state}')  # Clean up

        client = Client.objects.filter(id=client_id).first()
        if not client:
            if request.method == "GET":
                frontend_callback_url = f"{frontend_base}/oauth/callback?error=client_not_found"
                return redirect(frontend_callback_url)
            return JsonResponse({"success": False, "error": "client_not_found"}, status=400)

        platform = Platform.objects.filter(name=platform_name).first()
        if not platform:
            if request.method == "GET":
                frontend_callback_url = f"{frontend_base}/oauth/callback?error=platform_not_found"
                return redirect(frontend_callback_url)
            return JsonResponse({"success": False, "error": "platform_not_found"}, status=400)

        # Exchange code for access token
        token_data = None

        if platform_name in ["FACEBOOK", "INSTAGRAM"]:
            app_id = getattr(settings, 'FACEBOOK_APP_ID', '')
            app_secret = getattr(settings, 'FACEBOOK_APP_SECRET', '')
            redirect_uri = getattr(settings, 'FACEBOOK_REDIRECT_URI' if platform_name == "FACEBOOK" else 'INSTAGRAM_REDIRECT_URI', '')

            if not app_id or not app_secret or not redirect_uri:
                if request.method == "GET":
                    return JsonResponse({"error": "OAuth credentials not configured"}, status=500)
                return JsonResponse({"success": False, "error": "OAuth credentials not configured"}, status=500)

            token_url = f"https://graph.facebook.com/{settings.FACEBOOK_GRAPH_API_VERSION}/oauth/access_token"
            token_params = {
                "client_id": app_id,
                "client_secret": app_secret,
                "redirect_uri": redirect_uri,
                "code": code,
            }

            token_response = requests.get(token_url, params=token_params)
            token_response.raise_for_status()
            token_data = token_response.json()

        if not token_data or "access_token" not in token_data:
            if request.method == "GET":
                frontend_callback_url = f"{frontend_base}/oauth/callback?error=token_exchange_failed"
                return redirect(frontend_callback_url)
            return JsonResponse({"success": False, "error": "token_exchange_failed"}, status=400)

        access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in")

        # Calculate token expiry
        token_expiry = None
        if expires_in:
            token_expiry = datetime.now() + timedelta(seconds=expires_in)

        # Get user profile information
        profile_data = None
        account_username = None
        account_id = None

        if platform_name == "FACEBOOK":
            # Get user's pages
            pages_url = f"https://graph.facebook.com/{settings.FACEBOOK_GRAPH_API_VERSION}/me/accounts"
            pages_params = {
                "access_token": access_token,
                "fields": "id,name,access_token,tasks"
            }
            pages_response = requests.get(pages_url, params=pages_params)

            if pages_response.status_code != 200:
                raise requests.RequestException(f"facebook_pages_lookup_failed:{pages_response.status_code}")

            pages_data = pages_response.json()
            if settings.DEBUG:
                print(f"[DEBUG] Facebook pages lookup response: {pages_data}")
            if not pages_data.get("data"):
                raise requests.RequestException("no_facebook_pages")

            # Use first page for now
            page = pages_data["data"][0]
            account_id = page.get("id")
            account_username = page.get("name") or page.get("id")
            page_access_token = page.get("access_token")
            
            if not page_access_token:
                raise requests.RequestException("no_page_access_token_in_response")
            
            access_token = page_access_token
            if settings.DEBUG:
                print(f"[DEBUG] Using page access token for page {account_id}")

        elif platform_name == "INSTAGRAM":
            # Get Instagram business account
            ig_url = f"https://graph.facebook.com/{settings.FACEBOOK_GRAPH_API_VERSION}/me/accounts"
            ig_params = {"access_token": access_token}
            ig_response = requests.get(ig_url, params=ig_params)

            if ig_response.status_code != 200:
                raise requests.RequestException(f"instagram_account_lookup_failed:{ig_response.status_code}")

            ig_data = ig_response.json()
            if not ig_data.get("data"):
                raise requests.RequestException("no_instagram_business_account")

            for account in ig_data["data"]:
                if account.get("instagram_business_account"):
                    account_id = account["instagram_business_account"]["id"]
                    account_username = account["instagram_business_account"].get("username")
                    break

            if not account_id:
                raise requests.RequestException("no_instagram_business_account")

        # Normalize account values to avoid NULL inserts for fields that require strings
        account_id = account_id or ''
        account_username = account_username or platform_name.title()

        # Create or update social media account
        account, created = SocialMediaAccount.objects.get_or_create(
            client=client,
            platform=platform,
            defaults={
                'account_username': account_username,
                'account_id': account_id,
                'access_token': access_token,
                'token_expiry': token_expiry,
                'is_active': True,
            }
        )

        if not created:
            account.account_username = account_username
            account.account_id = account_id or account.account_id or ''
            account.access_token = access_token
            account.token_expiry = token_expiry
            account.is_active = True
            account.save()

        # Ensure ClientPlatform exists
        ClientPlatform.objects.get_or_create(client=client, platform=platform)

        if request.method == "GET":
            frontend_callback_url = f"{frontend_base}/oauth/callback?platform={platform_name.lower()}&success=true&account={account_username}"
            return redirect(frontend_callback_url)

        return JsonResponse({"success": True, "platform": platform_name.lower(), "account": account_username})

    except requests.RequestException as e:
        error_code = "oauth_request_failed"
        message = str(e)
        if message in ["no_facebook_pages", "no_instagram_business_account"]:
            error_code = message
        elif message.startswith("facebook_pages_lookup_failed"):
            error_code = "facebook_pages_lookup_failed"
        elif message.startswith("instagram_account_lookup_failed"):
            error_code = "instagram_account_lookup_failed"

        details = quote_plus(message) if settings.DEBUG else None
        if request.method == "GET":
            frontend_callback_url = f"{frontend_base}/oauth/callback?error={error_code}"
            if details:
                frontend_callback_url += f"&details={details}"
            return redirect(frontend_callback_url)
        response = {"success": False, "error": error_code}
        if settings.DEBUG:
            response["details"] = message
        return JsonResponse(response, status=500)
    except Exception as e:
        details = quote_plus(str(e)) if settings.DEBUG else None
        if request.method == "GET":
            frontend_callback_url = f"{frontend_base}/oauth/callback?error=server_error"
            if details:
                frontend_callback_url += f"&details={details}"
            return redirect(frontend_callback_url)
        response = {"success": False, "error": "server_error"}
        if settings.DEBUG:
            response["details"] = str(e)
        return JsonResponse(response, status=500)


# =========================================================
# TOKEN REFRESH
# =========================================================

@csrf_exempt
def refresh_token_view(request):
    """
    Refresh expired OAuth tokens
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)
        account_id = data.get("account_id")

        if not account_id:
            return JsonResponse({"error": "Account ID is required"}, status=400)

        account = SocialMediaAccount.objects.filter(id=account_id).first()
        if not account:
            return JsonResponse({"error": "Account not found"}, status=404)

        # For now, Facebook tokens don't support refresh tokens in the same way
        # We'll need to re-authenticate when tokens expire
        return JsonResponse({"error": "Token refresh not implemented - please re-authenticate"}, status=501)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =========================================================
# GET PLATFORMS
# =========================================================

def get_platforms(request):

    data = []

    for p in ensure_platform_records():

        data.append({
            "id": p.id,
            "value": p.name.lower(),
            "label": p.get_name_display()
        })

    return JsonResponse(data, safe=False)


def _platform_connected_data(platform, client):
    account = SocialMediaAccount.objects.filter(client=client, platform=platform, is_active=True).first()
    supported = platform.name in ['FACEBOOK', 'INSTAGRAM']
    return {
        "id": platform.id,
        "value": platform.name.lower(),
        "label": platform.get_name_display(),
        "connected": bool(account),
        "account_username": account.account_username if account else None,
        "supports_graph": supported,
        "is_supported": supported,
    }


@csrf_exempt
def connected_platforms_view(request):
    client = _resolve_client(request)
    if not client:
        return JsonResponse({"error": "No client found."}, status=400)

    if request.method == 'GET':
        data = [_platform_connected_data(p, client) for p in ensure_platform_records()]
        return JsonResponse(data, safe=False)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON payload."}, status=400)

        platforms = data.get('platforms', [])
        if not isinstance(platforms, list):
            return JsonResponse({"error": "Platforms must be an array."}, status=400)

        results = []
        for platform_value in platforms:
            platform = Platform.objects.filter(name__iexact=platform_value).first()
            if not platform:
                results.append({"platform": platform_value, "status": "unknown_platform"})
                continue

            # For OAuth platforms, we don't connect here - we initiate OAuth flow
            if platform.name in ['FACEBOOK', 'INSTAGRAM']:
                results.append({
                    "platform": platform.name.lower(),
                    "status": "oauth_required",
                    "message": f"OAuth required for {platform.name}"
                })
            else:
                results.append({
                    "platform": platform.name.lower(),
                    "status": "unsupported_platform"
                })

        response_data = {
            "message": "Platform connection initiated.",
            "results": results,
        }
        return JsonResponse(response_data, status=200)

    return JsonResponse({"error": "Method not allowed."}, status=405)


def _publish_post_to_graph(post, platform_values, request):
    results = []
    for platform_name in platform_values:
        platform_name = platform_name.upper()
        platform = Platform.objects.filter(name__iexact=platform_name).first()
        if not platform:
            results.append({"platform": platform_name, "status": "unknown_platform"})
            continue

        account = SocialMediaAccount.objects.filter(client=post.client, platform=platform, is_active=True).first()
        
        if not account:
            results.append({"platform": platform_name, "status": "missing_account"})
            if settings.DEBUG:
                print(f"[DEBUG] No connected account found for client {post.client.id}, platform {platform_name}")
            continue
        
        if not account.access_token or not account.account_id:
            results.append({"platform": platform_name, "status": "missing_credentials", "message": "Account missing token or ID"})
            if settings.DEBUG:
                print(f"[DEBUG] Account {account.id} missing token or account_id")
            continue

        try:
            media_url = None
            if post.media:
                media_url = request.build_absolute_uri(post.media.url)
            publish_response = publish_social_post(post, platform_name, account, media_url=media_url)
            results.append({"platform": platform_name, "status": "published", "response": publish_response})
        except NotImplementedError as not_impl:
            results.append({"platform": platform_name, "status": "unsupported", "message": str(not_impl)})
        except Exception as error:
            error_message = str(error)
            results.append({"platform": platform_name, "status": "failed", "message": error_message})
            if settings.DEBUG:
                print(f"[DEBUG] publish failed for client {post.client.id}, platform {platform_name}, account {getattr(account, 'account_id', None)}: {error_message}")

    return results


def _resolve_client(request):
    client_id = request.GET.get('client_id') or request.POST.get('client_id')
    if client_id:
        return Client.objects.filter(id=client_id).first()
    return Client.objects.first()


def _serialize_post(post, request):
    platforms = [pp.platform.name.lower() for pp in PostPlatform.objects.filter(post=post)]
    schedule = getattr(post, 'postschedule', None)
    return {
        'id': post.id,
        'title': post.title,
        'caption': post.caption,
        'status': post.status,
        'platforms': platforms,
        'created_at': post.created_at.isoformat(),
        'scheduled_time': schedule.scheduled_time.isoformat() if schedule else None,
        'posted_time': schedule.posted_time.isoformat() if schedule and schedule.posted_time else None,
        'media_url': request.build_absolute_uri(post.media.url) if post.media else None,
    }

'''
@csrf_exempt
def posts_view(request):
    client = _resolve_client(request)
    if not client:
        return JsonResponse({"error": "No client found."}, status=400)

    if request.method == 'GET':
        posts = Post.objects.filter(client=client).order_by('-created_at')
        data = [_serialize_post(post, request) for post in posts]
        return JsonResponse(data, safe=False)

    if request.method == 'POST':
        caption = request.POST.get('caption', '').strip()
        platform_values = request.POST.getlist('platforms') or []
        mode = request.POST.get('mode', 'now')
        scheduled_time = request.POST.get('scheduled_time', '').strip()
        media = request.FILES.get('media')

        if not caption:
            return JsonResponse({"error": "Caption is required."}, status=400)
        if not platform_values:
            return JsonResponse({"error": "Select at least one platform."}, status=400)
        if mode == 'later' and not scheduled_time:
            return JsonResponse({"error": "Scheduled time is required for schedule later."}, status=400)

        post = Post.objects.create(
            client=client,
            caption=caption,
            title=caption[:50],
            media=media,
            status='POSTED' if mode == 'now' else 'SCHEDULED'
        )

        for platform_value in platform_values:
            platform = Platform.objects.filter(name__iexact=platform_value).first()
            if platform:
                PostPlatform.objects.get_or_create(post=post, platform=platform)

        publish_results = None
        if mode == 'now':
            publish_results = _publish_post_to_graph(post, platform_values, request)
            if settings.DEBUG:
                print(f"[DEBUG] publish_results for post {post.id}: {publish_results}")
            failed = [item for item in publish_results if item['status'] == 'failed']
            if failed:
                post.status = 'FAILED'
                post.save()
            else:
                post.status = 'POSTED'
                post.save()

        if mode == 'later' and scheduled_time:
            parsed = parse_datetime(scheduled_time)

            if not parsed:
                return JsonResponse(
                    {"error": "Scheduled time must be valid ISO 8601."},
                    status=400
                )
            from django.utils import timezone
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())

            schedule = PostSchedule.objects.create(
                post=post,
                scheduled_time=parsed
            )

            from client.tasks import publish_scheduled_post

            publish_scheduled_post.apply_async(
                args=[post.id],
                eta=schedule.scheduled_time
            )

        response_body = {"message": "Post created successfully.", "post_id": post.id}
        if publish_results is not None:
            response_body['publish_results'] = publish_results

        return JsonResponse(response_body, status=201)

    return JsonResponse({"error": "Method not allowed."}, status=405)

'''

@csrf_exempt
def posts_view(request):

    if request.method == 'GET':

        client = _resolve_client(request)

        if not client:
            return JsonResponse(
                {"error": "No client found."},
                status=400
            )

        posts = Post.objects.filter(
            clients=client
        ).order_by('-created_at')

        data = []

        for post in posts:

            platforms = [
                pp.platform.name.lower()
                for pp in PostPlatform.objects.filter(post=post)
            ]

            schedule = getattr(post, 'postschedule', None)

            data.append({
                'id': post.id,
                'title': post.title,
                'caption': post.caption,
                'status': post.status,
                'platforms': platforms,
                'created_at': post.created_at.isoformat(),
                'scheduled_time': (
                    schedule.scheduled_time.isoformat()
                    if schedule else None
                ),
                'posted_time': (
                    schedule.posted_time.isoformat()
                    if schedule and schedule.posted_time else None
                ),
                'media_url': (
                    request.build_absolute_uri(post.media.url)
                    if post.media else None
                ),
            })

        return JsonResponse(data, safe=False)

    # =====================================================
    # CREATE POSTS
    # =====================================================

    if request.method == 'POST':

        try:

            caption = request.POST.get('caption', '').strip()

            platform_values = request.POST.getlist('platforms')

            client_ids = request.POST.getlist('clients')

            mode = request.POST.get('mode', 'now')

            scheduled_time = request.POST.get(
                'scheduled_time',
                ''
            ).strip()

            media = request.FILES.get('media')

            smh_user_id = request.POST.get('smh_user_id')

            # ---------------------------------------------
            # VALIDATIONS
            # ---------------------------------------------

            if not caption:
                return JsonResponse(
                    {"error": "Caption is required."},
                    status=400
                )

            if not client_ids:
                return JsonResponse(
                    {"error": "Select at least one client."},
                    status=400
                )

            if not platform_values:
                return JsonResponse(
                    {"error": "Select at least one platform."},
                    status=400
                )

            if mode == 'later' and not scheduled_time:
                return JsonResponse(
                    {"error": "Scheduled time is required."},
                    status=400
                )

            # ---------------------------------------------
            # GET SMH
            # ---------------------------------------------

            smh = None

            if smh_user_id:
                smh = SMH.objects.filter(
                    user__id=smh_user_id
                ).first()

            created_posts = []

            all_publish_results = []

            # ---------------------------------------------
            # CREATE POST FOR EACH CLIENT
            # ---------------------------------------------

            for client_id in client_ids:

                client = Client.objects.filter(
                    id=client_id
                ).first()

                if not client:
                    continue

                # -----------------------------------------
                # CREATE POST
                # -----------------------------------------

                post = Post.objects.create(
                    created_by=smh,
                    caption=caption,
                    title=caption[:50],
                    media=media,
                    status='POSTED' if mode == 'now' else 'SCHEDULED'
                )

                post.clients.add(client)

                created_posts.append(post)

                # -----------------------------------------
                # SAVE PLATFORMS
                # -----------------------------------------

                for platform_value in platform_values:

                    platform = Platform.objects.filter(
                        name__iexact=platform_value
                    ).first()

                    if platform:

                        PostPlatform.objects.get_or_create(
                            post=post,
                            platform=platform
                        )

                # -----------------------------------------
                # POST NOW
                # -----------------------------------------

                if mode == 'now':

                    publish_results = _publish_post_to_graph(
                        post,
                        platform_values,
                        request
                    )

                    all_publish_results.append({
                        "post_id": post.id,
                        "client_id": client.id,
                        "results": publish_results
                    })

                    failed = [
                        item
                        for item in publish_results
                        if item['status'] == 'failed'
                    ]

                    if failed:
                        post.status = 'FAILED'
                    else:
                        post.status = 'POSTED'

                    post.save()

                # -----------------------------------------
                # SCHEDULE LATER
                # -----------------------------------------

                if mode == 'later':

                    parsed = parse_datetime(
                        scheduled_time
                    )

                    if not parsed:
                        return JsonResponse(
                            {
                                "error":
                                "Scheduled time must be valid ISO 8601."
                            },
                            status=400
                        )

                    from django.utils import timezone

                    if timezone.is_naive(parsed):

                        parsed = timezone.make_aware(
                            parsed,
                            timezone.get_current_timezone()
                        )

                    schedule = PostSchedule.objects.create(
                        post=post,
                        scheduled_time=parsed
                    )

                    from client.tasks import (
                        publish_scheduled_post
                    )

                    publish_scheduled_post.apply_async(
                        args=[post.id],
                        eta=schedule.scheduled_time
                    )

            # ---------------------------------------------
            # FINAL RESPONSE
            # ---------------------------------------------

            return JsonResponse({
                "message": "Posts created successfully.",
                "total_posts": len(created_posts),
                "post_ids": [
                    post.id
                    for post in created_posts
                ],
                "publish_results": all_publish_results
            }, status=201)

        except Exception as e:

            return JsonResponse({
                "error": str(e)
            }, status=500)

    return JsonResponse(
        {"error": "Method not allowed."},
        status=405
    )


# =========================================================
# GET CLIENTS for smh_scheduler
# =========================================================

def clients_view(request):

    clients = Client.objects.all()

    data = []

    for client in clients:

        data.append({
            "id": client.id,
            "name": client.user.first_name,
            "organization": client.organization_name,
        })

    return JsonResponse(data, safe=False)


# =========================================================
# SMH CREATE POSTS
# =========================================================

@csrf_exempt
def smh_create_posts_view(request):

    if request.method != 'POST':
        return JsonResponse(
            {"error": "Only POST allowed"},
            status=405
        )

    try:

        caption = request.POST.get('caption', '').strip()

        client_ids = request.POST.getlist('client_ids')

        platform_values = request.POST.getlist('platforms')

        mode = request.POST.get('mode', 'now')

        scheduled_time = request.POST.get('scheduled_time')

        media = request.FILES.get('media')

        if not caption:
            return JsonResponse(
                {"error": "Caption is required"},
                status=400
            )

        if not client_ids:
            return JsonResponse(
                {"error": "Select clients"},
                status=400
            )

        if not platform_values:
            return JsonResponse(
                {"error": "Select platforms"},
                status=400
            )

        created_posts = []

        for client_id in client_ids:

            client = Client.objects.filter(id=client_id).first()

            if not client:
                continue

            post = Post.objects.create(
            caption=caption,
            title=caption[:50],
            media=media,
            status='POSTED' if mode == 'now' else 'SCHEDULED',
            post_type='NOW' if mode == 'now' else 'SCHEDULED',
            created_by_role='SMH'
            )

            post.clients.add(client)

            for platform_value in platform_values:

                platform = Platform.objects.filter(
                    name__iexact=platform_value
                ).first()

                if platform:

                    PostPlatform.objects.get_or_create(
                        post=post,
                        platform=platform
                    )

            # POST NOW
            if mode == 'now':

                publish_results = _publish_smh_post_to_graph(
                    post,
                    client,
                    platform_values,
                    request
                )

                failed = [
                    item for item in publish_results
                    if item['status'] == 'failed'
                ]

                if failed:
                    post.status = 'FAILED'
                else:
                    post.status = 'POSTED'

                post.save()

            # SCHEDULE
            else:

                parsed = parse_datetime(scheduled_time)

                from django.utils import timezone

                if timezone.is_naive(parsed):
                    parsed = timezone.make_aware(
                        parsed,
                        timezone.get_current_timezone()
                    )

                schedule = PostSchedule.objects.create(
                    post=post,
                    scheduled_time=parsed
                )

                from client.tasks import publish_scheduled_post

                publish_scheduled_post.apply_async(
                    args=[post.id],
                    eta=schedule.scheduled_time
                )

            created_posts.append(post.id)

        return JsonResponse({
            "message": "Posts processed successfully",
            "posts": created_posts
        })

    except Exception as e:

        return JsonResponse({
            "error": str(e)
        }, status=500)
#--------------------------------------------------------------------------------


def _publish_smh_post_to_graph(post, client, platform_values, request):

    results = []

    for platform_name in platform_values:

        platform_name = platform_name.upper()

        platform = Platform.objects.filter(
            name__iexact=platform_name
        ).first()

        if not platform:

            results.append({
                "platform": platform_name,
                "status": "unknown_platform"
            })

            continue

        account = SocialMediaAccount.objects.filter(
            client=client,
            platform=platform,
            is_active=True
        ).first()

        if not account:

            results.append({
                "platform": platform_name,
                "status": "missing_account"
            })

            continue

        if not account.access_token or not account.account_id:

            results.append({
                "platform": platform_name,
                "status": "missing_credentials"
            })

            continue

        try:

            media_url = None

            if post.media:

                media_url = request.build_absolute_uri(
                    post.media.url
                )

            publish_response = publish_social_post(
                post,
                platform_name,
                account,
                media_url=media_url
            )

            results.append({
                "platform": platform_name,
                "status": "published",
                "response": publish_response
            })

        except Exception as error:

            results.append({
                "platform": platform_name,
                "status": "failed",
                "message": str(error)
            })

    return results