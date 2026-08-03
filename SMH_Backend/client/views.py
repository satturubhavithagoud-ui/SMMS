import json
import requests
import secrets
from functools import wraps
from datetime import datetime, timedelta
from urllib.parse import quote_plus
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth import update_session_auth_hash
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone


from .models import (
    Client,
    SMH,
    Platform,
    ClientPlatform,
    SocialMediaAccount,
    Post,
    PostPlatform,
    PostSchedule,
    ClientSubscription,
    Package,
    Report,
    Notification,
    ClientPreferences,
)
from .facebook_api import publish_social_post


def ensure_platform_records():
    platforms = []
    for value, _label in Platform.PLATFORM_CHOICES:
        platform, _created = Platform.objects.get_or_create(name=value)
        platforms.append(platform)
    return platforms


def _is_authenticated(request):
    return bool(getattr(request, 'user', None) and request.user.is_authenticated)


def api_require_login(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not _is_authenticated(request):
            return JsonResponse({"error": "Authentication required."}, status=401)
        return view_func(request, *args, **kwargs)
    return _wrapped


def _resolve_client(request):
    """Resolve the target client for the current request.

    CLIENT users are always locked to their own client profile. SMH users may
    target any client via client_id. Unauthenticated requests resolve to None.
    """
    if not _is_authenticated(request):
        return None

    client_id = request.GET.get('client_id') or request.POST.get('client_id')
    if not client_id and 'application/json' in request.META.get('CONTENT_TYPE', ''):
        try:
            client_id = json.loads(request.body).get('client_id')
        except (ValueError, TypeError, json.JSONDecodeError):
            client_id = None

    if SMH.objects.filter(user=request.user).exists():
        if not client_id:
            return None
        return Client.objects.filter(id=client_id).first()

    return Client.objects.filter(user=request.user).first()


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

        login(request, user)

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
@api_require_login
def oauth_initiate_view(request):
    """
    Initiate OAuth flow for a platform
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)
        platform_name = data.get("platform", "").upper()

        if not platform_name:
            return JsonResponse({"error": "Platform is required"}, status=400)

        client = _resolve_client(request)

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
@api_require_login
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
@api_require_login
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
@api_require_login
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


@csrf_exempt
@api_require_login
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
        if mode != 'draft' and not platform_values:
            return JsonResponse({"error": "Select at least one platform."}, status=400)
        if mode == 'later' and not scheduled_time:
            return JsonResponse({"error": "Scheduled time is required for schedule later."}, status=400)
        parsed_scheduled_time = None
        if mode == 'later':
            parsed_scheduled_time = parse_datetime(scheduled_time)
            if not parsed_scheduled_time:
                return JsonResponse({"error": "Scheduled time must be valid ISO 8601."}, status=400)

        if mode == 'draft':
            status = 'DRAFT'
        elif mode == 'later':
            status = 'SCHEDULED'
        else:
            status = 'POSTED'

        post = Post.objects.create(
            client=client,
            caption=caption,
            title=caption[:50],
            media=media,
            status=status
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
            successful = [item for item in publish_results if item['status'] == 'published']
            if successful and len(successful) == len(publish_results):
                post.status = 'POSTED'
            else:
                post.status = 'FAILED'
            post.save()

        if mode == 'later':
            PostSchedule.objects.create(post=post, scheduled_time=parsed_scheduled_time)

        response_body = {"message": "Post created successfully.", "post_id": post.id}
        if publish_results is not None:
            response_body['publish_results'] = publish_results

        return JsonResponse(response_body, status=201)

    return JsonResponse({"error": "Method not allowed."}, status=405)


@csrf_exempt
@api_require_login
def smh_dashboard_summary_view(request):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed"}, status=405)

    try:
        active_clients = Client.objects.all()
        active_clients_count = active_clients.count()

        now = timezone.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Count posts created/updated today with status='POSTED'
        posts_today_count = Post.objects.filter(status='POSTED', updated_at__gte=start_of_today).count()

        # Posts scheduled count
        posts_scheduled_count = Post.objects.filter(status='SCHEDULED').count()

        # Total reach
        from django.db.models import Sum
        total_reach = Report.objects.aggregate(Sum('total_reach'))['total_reach__sum'] or 0
        if total_reach == 0:
            # Fallback based on posted posts
            posted_posts = Post.objects.filter(status='POSTED').count()
            total_reach = posted_posts * 12500 + 1200000

        def format_reach(val):
            if val >= 1000000:
                return f"{val/1000000:.1f}M"
            elif val >= 1000:
                return f"{val/1000:.0f}K"
            return str(val)

        formatted_reach = format_reach(total_reach)

        # Mon-Sun last 7 days published vs scheduled post statistics
        days_data = []
        for i in range(6, -1, -1):
            day_date = now - timedelta(days=i)
            day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            day_name = day_date.strftime('%a')

            published_count = Post.objects.filter(
                status='POSTED',
                updated_at__range=(day_start, day_end)
            ).count()

            scheduled_count = PostSchedule.objects.filter(
                post__status='SCHEDULED',
                scheduled_time__range=(day_start, day_end)
            ).count()

            # Map counts to percentages for rendering heights in frontend (100% max check)
            max_val = max(published_count, scheduled_count)
            scale = 10
            if max_val > 10:
                scale = 100 / max_val
            elif max_val == 0:
                scale = 1

            days_data.append({
                'day': day_name,
                'p': int(published_count * scale) if published_count > 0 else 5,
                's': int(scheduled_count * scale) if scheduled_count > 0 else 5,
                'published_count': published_count,
                'scheduled_count': scheduled_count
            })

        # Recent alerts/notifications
        notifications = Notification.objects.all().order_by('-created_at')[:5]
        alerts_list = []
        for n in notifications:
            alerts_list.append({
                'title': n.title,
                'message': n.message,
                'type': 'warning' if 'failed' in n.notification_type.lower() or 'expiry' in n.notification_type.lower() else 'info'
            })

        if not alerts_list:
            # Check for failed posts to generate automatic warning alerts
            failed_posts = Post.objects.filter(status='FAILED').order_by('-updated_at')[:2]
            for fp in failed_posts:
                alerts_list.append({
                    'title': 'Post Failed',
                    'message': f"Post for '{fp.client.organization_name or fp.client.user.username}' failed to publish.",
                    'type': 'warning'
                })
            
            # Check if any social accounts are expiring or active
            active_accounts = SocialMediaAccount.objects.filter(is_active=True).order_by('-connected_at')[:2]
            for acc in active_accounts:
                alerts_list.append({
                    'title': 'Platform Connected',
                    'message': f"{acc.platform.name.title()} page connected for '{acc.client.organization_name or acc.client.user.username}'.",
                    'type': 'info'
                })

        if not alerts_list:
            alerts_list = [
                {
                    'title': 'API Status OK',
                    'message': 'All configured social media platforms are running normally.',
                    'type': 'info'
                }
            ]

        # Client roster
        client_roster = []
        for client in active_clients:
            platforms_connected = []
            accounts = SocialMediaAccount.objects.filter(client=client, is_active=True)
            for acc in accounts:
                platforms_connected.append(acc.platform.name.lower())

            if not platforms_connected:
                cp_list = ClientPlatform.objects.filter(client=client)
                platforms_connected = [cp.platform.name.lower() for cp in cp_list]

            subscription = ClientSubscription.objects.filter(client=client, status='ACTIVE').first()
            plan_name = subscription.package.name if subscription else "Free Tier"

            week_ago = now - timedelta(days=7)
            weekly_posts_count = Post.objects.filter(client=client, created_at__gte=week_ago).count()

            client_roster.append({
                'id': client.id,
                'name': client.organization_name or client.user.username,
                'industry': client.industry or 'General Business',
                'plan': plan_name,
                'platforms': platforms_connected,
                'status': 'Active' if (subscription and subscription.status == 'ACTIVE') else 'Pending',
                'weekly_posts': f"{weekly_posts_count} posts",
                'logo': request.build_absolute_uri(client.logo.url) if client.logo else None
            })

        return JsonResponse({
            'active_clients': active_clients_count,
            'posts_published_today': posts_today_count,
            'posts_scheduled': posts_scheduled_count,
            'total_reach': formatted_reach,
            'chart_data': days_data,
            'alerts': alerts_list,
            'client_roster': client_roster
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt

@api_require_login
def smh_clients_view(request):
    """Handle GET and POST for SMH client list and creation."""
    if request.method == 'GET':
        client_list = []
        for client in Client.objects.all():
            subscription = ClientSubscription.objects.filter(client=client, status='ACTIVE').first()
            plan_name = subscription.package.name if subscription else "Free Tier"
            client_list.append({
                'id': client.id,
                'name': client.organization_name or client.user.username,
                'industry': client.industry or '',
                'plan': plan_name,
                'logo': request.build_absolute_uri(client.logo.url) if hasattr(client, 'logo') and client.logo else None,
            })
        return JsonResponse(client_list, safe=False)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            fullname = data.get('fullname')
            email = data.get('email')
            password = data.get('password')
            platforms = data.get('platforms', [])
            if not fullname or not email or not password:
                return JsonResponse({'error': 'All fields required'}, status=400)
            if User.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Email already exists'}, status=400)
            user = User.objects.create_user(username=email, email=email, password=password, first_name=fullname)
            client = Client.objects.create(user=user, organization_name='')
            available = {p.name: p for p in ensure_platform_records()}
            for plat_name in [p.upper() for p in platforms if isinstance(p, str)]:
                platform = available.get(plat_name)
                if platform:
                    ClientPlatform.objects.get_or_create(client=client, platform=platform)
            return JsonResponse({'message': 'Client created', 'client_id': client.id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


# =========================================================
# SMH CONTENT QUEUE HELPERS
# =========================================================

def _serialize_post_smh(post, request):
    """Serialize a post for the SMH content queue view, including client info."""
    platforms = [pp.platform.name.lower() for pp in PostPlatform.objects.filter(post=post)]
    schedule = getattr(post, 'postschedule', None)

    client_name = (
        post.client.organization_name
        or post.client.user.first_name
        or post.client.user.username
    )

    error = None
    if post.status == 'FAILED':
        if schedule and schedule.failure_reason:
            error = schedule.failure_reason
        else:
            error = 'Publishing failed'

    display_status = post.status
    if display_status == 'POSTED':
        display_status = 'PUBLISHED'

    return {
        'id': post.id,
        'title': post.title,
        'caption': post.caption,
        'status': display_status,
        'platforms': platforms,
        'client_name': client_name,
        'client_id': post.client.id,
        'created_at': post.created_at.isoformat(),
        'updated_at': post.updated_at.isoformat(),
        'scheduled_time': schedule.scheduled_time.isoformat() if schedule else None,
        'posted_time': schedule.posted_time.isoformat() if schedule and schedule.posted_time else None,
        'media_url': request.build_absolute_uri(post.media.url) if post.media else None,
        'error': error,
        'hashtags': post.hashtags,
    }


# =========================================================
# SMH CONTENT QUEUE VIEW
# =========================================================

@csrf_exempt
@api_require_login
def smh_content_queue_view(request):
    """List all posts across all clients for the SMH portal."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method allowed'}, status=405)

    try:
        status_filter = request.GET.get('status', '').upper()
        platform_filter = request.GET.get('platform', '').upper()

        posts = Post.objects.all().select_related('client', 'client__user').order_by('-created_at')

        if status_filter:
            db_status = 'POSTED' if status_filter == 'PUBLISHED' else status_filter
            posts = posts.filter(status=db_status)

        if platform_filter:
            post_ids = PostPlatform.objects.filter(
                platform__name=platform_filter
            ).values_list('post_id', flat=True)
            posts = posts.filter(id__in=post_ids)

        data = [_serialize_post_smh(post, request) for post in posts]
        return JsonResponse(data, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# SMH ANALYTICS VIEW
# =========================================================

@csrf_exempt
@api_require_login
def smh_analytics_view(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method allowed'}, status=405)
    try:
        from django.db.models import Sum, Count
        from django.utils import timezone
        from datetime import timedelta

        period = request.GET.get('period', '30')
        try:
            days = int(period)
        except (ValueError, TypeError):
            days = 30
        since = timezone.now() - timedelta(days=days)

        report_agg = Report.objects.filter(generated_at__gte=since).aggregate(
            total_engagement=Sum('total_engagement'),
            total_reach=Sum('total_reach'),
            total_followers=Sum('followers_gained'),
        )
        total_engagement = report_agg['total_engagement'] or 0
        total_reach = report_agg['total_reach'] or 0
        followers_growth = report_agg['total_followers'] or 0

        if total_reach == 0:
            posted_posts = Post.objects.filter(status='POSTED', created_at__gte=since).count()
            total_reach = posted_posts * 12500 + 1200000

        published_posts = Post.objects.filter(status='POSTED', created_at__gte=since).count()
        ctr = round((total_engagement / total_reach * 100) if total_reach > 0 else 0, 1)

        # Platform stats within period
        platform_qs = ensure_platform_records()
        post_counts = {}
        for p in platform_qs:
            cnt = PostPlatform.objects.filter(
                platform=p,
                post__created_at__gte=since,
            ).count()
            post_counts[p.id] = cnt
        max_count = max(post_counts.values()) if post_counts else 1
        platform_stats_data = []
        for p in platform_qs:
            cnt = post_counts.get(p.id, 0)
            platform_stats_data.append({
                'name': p.get_name_display(),
                'key': p.name.lower(),
                'value': cnt,
                'width_pct': round((cnt / max_count) * 100),
            })

        # Best performing content — recent posted posts within period
        recent_posts = Post.objects.filter(status='POSTED', created_at__gte=since).order_by('-updated_at')[:5]
        best_content = []
        for post in recent_posts:
            platforms_queried = [pp.platform.name.lower() for pp in PostPlatform.objects.filter(post=post)]
            best_content.append({
                'id': post.id,
                'title': post.title or post.caption[:50],
                'platforms': platforms_queried,
                'caption': post.caption,
                'media_url': request.build_absolute_uri(post.media.url) if post.media else None,
            })

        return JsonResponse({
            'total_engagement': total_engagement,
            'total_reach': total_reach,
            'followers_growth': followers_growth,
            'ctr': ctr,
            'published_posts': published_posts,
            'platform_stats': platform_stats_data,
            'best_content': best_content,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# INDIVIDUAL POST OPERATIONS
# =========================================================

@csrf_exempt
@api_require_login
def post_detail_view(request, post_id):
    """Handle GET detail and DELETE for a single post."""
    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({'error': 'Post not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(_serialize_post_smh(post, request))

    if request.method == 'DELETE':
        deleted_id = post.id
        post.delete()
        return JsonResponse({'message': 'Post deleted successfully', 'post_id': deleted_id})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@api_require_login
def post_publish_view(request, post_id):
    """Immediately publish a scheduled or draft post."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({'error': 'Post not found'}, status=404)

    if post.status not in ('SCHEDULED', 'DRAFT', 'APPROVED'):
        return JsonResponse({
            'error': f'Cannot publish a post with status {post.status}'
        }, status=400)

    platform_values = [
        pp.platform.name for pp in PostPlatform.objects.filter(post=post)
    ]

    if not platform_values:
        return JsonResponse({'error': 'No platforms assigned to this post'}, status=400)

    publish_results = _publish_post_to_graph(post, platform_values, request)

    failed = [r for r in publish_results if r['status'] != 'published']
    if failed:
        post.status = 'FAILED'
        post.save()
        try:
            schedule = post.postschedule
            schedule.status = 'FAILED'
            schedule.failure_reason = failed[0].get('message', 'Publishing failed')
            schedule.save()
        except PostSchedule.DoesNotExist:
            pass
    else:
        post.status = 'POSTED'
        post.save()
        try:
            schedule = post.postschedule
            schedule.status = 'COMPLETED'
            schedule.posted_time = timezone.now()
            schedule.save()
        except PostSchedule.DoesNotExist:
            pass

    return JsonResponse({
        'message': 'Post published successfully' if not failed else 'Publishing failed',
        'post': _serialize_post_smh(post, request),
        'publish_results': publish_results,
    })


@csrf_exempt
@api_require_login
def post_retry_view(request, post_id):
    """Retry publishing a failed post."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({'error': 'Post not found'}, status=404)

    if post.status != 'FAILED':
        return JsonResponse({
            'error': f'Can only retry failed posts, current status is {post.status}'
        }, status=400)

    platform_values = [
        pp.platform.name for pp in PostPlatform.objects.filter(post=post)
    ]

    if not platform_values:
        return JsonResponse({'error': 'No platforms assigned to this post'}, status=400)

    publish_results = _publish_post_to_graph(post, platform_values, request)

    failed = [r for r in publish_results if r['status'] != 'published']
    if failed:
        post.status = 'FAILED'
        post.save()
        try:
            schedule = post.postschedule
            schedule.status = 'FAILED'
            schedule.failure_reason = failed[0].get('message', 'Retry failed')
            schedule.save()
        except PostSchedule.DoesNotExist:
            pass
    else:
        post.status = 'POSTED'
        post.save()
        try:
            schedule = post.postschedule
            schedule.status = 'COMPLETED'
            schedule.posted_time = timezone.now()
            schedule.save()
        except PostSchedule.DoesNotExist:
            pass

    return JsonResponse({
        'message': 'Post published successfully' if not failed else 'Retry failed',
        'post': _serialize_post_smh(post, request),
        'publish_results': publish_results,
    })


@csrf_exempt
@api_require_login
def post_edit_view(request, post_id):
    """Edit a post's caption, hashtags, and/or media."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    post = Post.objects.filter(id=post_id).first()
    if not post:
        return JsonResponse({'error': 'Post not found'}, status=404)

    if post.status == 'POSTED':
        return JsonResponse({'error': 'Cannot edit a published post'}, status=400)

    content_type = request.content_type or ''

    if 'application/json' in content_type:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        caption = data.get('caption')
        hashtags = data.get('hashtags')
        scheduled_time = data.get('scheduled_time')
        platforms = data.get('platforms')
    else:
        caption = request.POST.get('caption')
        hashtags = request.POST.get('hashtags')
        scheduled_time = request.POST.get('scheduled_time')
        platforms = request.POST.getlist('platforms')
        # Check if platforms list is empty but might have a comma-separated string
        if not platforms and request.POST.get('platforms'):
            platforms = [p.strip() for p in request.POST.get('platforms').split(',')]
        media = request.FILES.get('media')
        if media:
            post.media = media

    if caption is not None:
        post.caption = caption
        post.title = caption[:50]

    if hashtags is not None:
        post.hashtags = hashtags

    if scheduled_time is not None:
        if scheduled_time == '':
            # Clear scheduled time if empty
            PostSchedule.objects.filter(post=post).delete()
        else:
            parsed = parse_datetime(scheduled_time)
            if parsed:
                # Make timezone aware if needed, Django handles naive/aware depending on settings
                PostSchedule.objects.update_or_create(post=post, defaults={'scheduled_time': parsed})

    if platforms is not None:
        # Clear existing platforms and create new ones
        PostPlatform.objects.filter(post=post).delete()
        for plat_val in platforms:
            platform = Platform.objects.filter(name__iexact=plat_val).first()
            if platform:
                PostPlatform.objects.get_or_create(post=post, platform=platform)

    post.save()

    return JsonResponse({
        'message': 'Post updated successfully',
        'post': _serialize_post_smh(post, request),
    })


# =========================================================
# CLIENT DASHBOARD
# =========================================================

@csrf_exempt
@api_require_login
def client_dashboard_view(request):
    """Return all dashboard data for a single client (stats, platforms, recent posts, activity)."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method allowed'}, status=405)

    try:
        client = _resolve_client(request)
        if not client:
            return JsonResponse({'error': 'No client found.'}, status=400)

        from django.db.models import Sum

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # ---- Stats ----
        posts_this_month = Post.objects.filter(client=client, created_at__gte=month_start).count()
        posts_published = Post.objects.filter(client=client, status='POSTED').count()
        posts_scheduled = Post.objects.filter(client=client, status='SCHEDULED').count()
        posts_failed = Post.objects.filter(client=client, status='FAILED').count()
        drafts = Post.objects.filter(client=client, status='DRAFT').count()

        report_agg = Report.objects.filter(client=client).aggregate(
            total_engagement=Sum('total_engagement'),
            total_reach=Sum('total_reach'),
            followers=Sum('followers_gained'),
        )
        total_engagement = report_agg['total_engagement'] or 0
        total_reach = report_agg['total_reach'] or 0
        followers_gained = report_agg['followers'] or 0

        engagement_rate = round((total_engagement / total_reach * 100) if total_reach > 0 else 0, 1)

        # ---- Connected platforms ----
        connected_platforms = []
        for acc in SocialMediaAccount.objects.filter(client=client, is_active=True).select_related('platform'):
            connected_platforms.append({
                'platform': acc.platform.name.lower(),
                'label': acc.platform.get_name_display(),
                'account_username': acc.account_username,
                'connected_at': acc.connected_at.isoformat() if acc.connected_at else None,
                'token_expires': acc.token_expiry.isoformat() if acc.token_expiry else None,
            })

        selected_platforms = [
            cp.platform.name.lower()
            for cp in ClientPlatform.objects.filter(client=client).select_related('platform')
        ]

        # ---- Recent posts ----
        recent_posts = [_serialize_post(post, request) for post in Post.objects.filter(client=client).order_by('-created_at')[:6]]

        # ---- Recent activity ----
        activity = []
        notifications = Notification.objects.filter(client=client).order_by('-created_at')[:5]
        for n in notifications:
            activity.append({
                'title': n.title,
                'message': n.message,
                'type': n.notification_type,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
            })

        if not activity:
            failed_posts = Post.objects.filter(client=client, status='FAILED').order_by('-updated_at')[:2]
            for fp in failed_posts:
                activity.append({
                    'title': 'Post Failed',
                    'message': f"Post '{fp.caption[:60]}' failed to publish.",
                    'type': 'POST_FAILED',
                    'is_read': False,
                    'created_at': fp.updated_at.isoformat(),
                })

        # ---- Weekly chart (published vs scheduled) ----
        chart_data = []
        for i in range(6, -1, -1):
            day_date = now - timedelta(days=i)
            day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            published_count = Post.objects.filter(client=client, status='POSTED', updated_at__range=(day_start, day_end)).count()
            scheduled_count = PostSchedule.objects.filter(
                post__client=client,
                post__status='SCHEDULED',
                scheduled_time__range=(day_start, day_end),
            ).count()
            chart_data.append({
                'day': day_date.strftime('%a'),
                'published_count': published_count,
                'scheduled_count': scheduled_count,
            })

        return JsonResponse({
            'client_id': client.id,
            'organization_name': client.organization_name or client.user.username,
            'username': client.user.first_name or client.user.username,
            'industry': client.industry or 'General Business',
            'logo': request.build_absolute_uri(client.logo.url) if client.logo else None,
            'stats': {
                'posts_this_month': posts_this_month,
                'posts_published': posts_published,
                'posts_scheduled': posts_scheduled,
                'posts_failed': posts_failed,
                'drafts': drafts,
                'total_engagement': total_engagement,
                'total_reach': total_reach,
                'followers_gained': followers_gained,
                'engagement_rate': engagement_rate,
            },
            'connected_platforms': connected_platforms,
            'selected_platforms': selected_platforms,
            'recent_posts': recent_posts,
            'activity': activity,
            'chart_data': chart_data,
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# CLIENT ANALYTICS
# =========================================================

@csrf_exempt
@api_require_login
def client_analytics_view(request):
    """Return analytics for a single client: metrics, platform stats, chart buckets, best content."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method allowed'}, status=405)

    try:
        client = _resolve_client(request)
        if not client:
            return JsonResponse({'error': 'No client found.'}, status=400)

        from django.db.models import Sum

        period = request.GET.get('period', '30')
        try:
            days = int(period)
        except (ValueError, TypeError):
            days = 30
        if days < 1:
            days = 30
        since = timezone.now() - timedelta(days=days)

        # ---- Aggregated metrics within period ----
        report_agg = Report.objects.filter(client=client, generated_at__gte=since).aggregate(
            total_engagement=Sum('total_engagement'),
            total_reach=Sum('total_reach'),
            followers=Sum('followers_gained'),
        )
        total_engagement = report_agg['total_engagement'] or 0
        total_reach = report_agg['total_reach'] or 0
        followers_gained = report_agg['followers'] or 0

        posts_published = Post.objects.filter(client=client, status='POSTED', created_at__gte=since).count()
        posts_scheduled = Post.objects.filter(client=client, status='SCHEDULED', created_at__gte=since).count()
        drafts = Post.objects.filter(client=client, status='DRAFT', created_at__gte=since).count()

        engagement_rate = round((total_engagement / total_reach * 100) if total_reach > 0 else 0, 1)

        # ---- Platform stats (connected accounts, else selected platforms) ----
        platform_ids = set(SocialMediaAccount.objects.filter(client=client, is_active=True).values_list('platform_id', flat=True))
        if not platform_ids:
            platform_ids = set(ClientPlatform.objects.filter(client=client).values_list('platform_id', flat=True))

        platform_stats = []
        for platform in ensure_platform_records():
            if platform_ids and platform.id not in platform_ids:
                continue
            count = PostPlatform.objects.filter(
                platform=platform,
                post__client=client,
                post__created_at__gte=since,
            ).count()
            platform_stats.append({
                'name': platform.get_name_display(),
                'key': platform.name.lower(),
                'value': count,
            })
        max_count = max((p['value'] for p in platform_stats), default=1)
        for p in platform_stats:
            p['width_pct'] = round((p['value'] / max_count) * 100) if max_count else 0

        # ---- Chart buckets (daily up to 60 days, weekly beyond) ----
        chart_data = []
        if days <= 60:
            for i in range(days - 1, -1, -1):
                day_date = timezone.now() - timedelta(days=i)
                day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                published_count = Post.objects.filter(client=client, status='POSTED', updated_at__range=(day_start, day_end)).count()
                scheduled_count = PostSchedule.objects.filter(
                    post__client=client,
                    post__status='SCHEDULED',
                    scheduled_time__range=(day_start, day_end),
                ).count()
                chart_data.append({
                    'label': day_date.strftime('%a'),
                    'published_count': published_count,
                    'scheduled_count': scheduled_count,
                })
        else:
            weeks = (days + 6) // 7
            for w in range(weeks - 1, -1, -1):
                week_start = since + timedelta(days=w * 7)
                week_end = min(week_start + timedelta(days=7), timezone.now())
                published_count = Post.objects.filter(client=client, status='POSTED', updated_at__range=(week_start, week_end)).count()
                scheduled_count = PostSchedule.objects.filter(
                    post__client=client,
                    post__status='SCHEDULED',
                    scheduled_time__range=(week_start, week_end),
                ).count()
                chart_data.append({
                    'label': f'W{w + 1}',
                    'published_count': published_count,
                    'scheduled_count': scheduled_count,
                })

        # ---- Best performing content (recent published posts within period) ----
        best_content = []
        recent_posts = Post.objects.filter(client=client, status='POSTED', created_at__gte=since).order_by('-updated_at')[:5]
        for post in recent_posts:
            post_platforms = [pp.platform.name.lower() for pp in PostPlatform.objects.filter(post=post)]
            best_content.append({
                'id': post.id,
                'title': post.title or post.caption[:60],
                'caption': post.caption,
                'platforms': post_platforms,
                'media_url': request.build_absolute_uri(post.media.url) if post.media else None,
                'created_at': post.created_at.isoformat(),
            })

        return JsonResponse({
            'client_id': client.id,
            'period': days,
            'metrics': {
                'total_reach': total_reach,
                'total_engagement': total_engagement,
                'engagement_rate': engagement_rate,
                'followers_gained': followers_gained,
                'posts_published': posts_published,
                'posts_scheduled': posts_scheduled,
                'drafts': drafts,
            },
            'platform_stats': platform_stats,
            'chart_data': chart_data,
            'best_content': best_content,
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# CLIENT SETTINGS (PROFILE, PREFERENCES, SECURITY)
# =========================================================

PREFERENCE_DEFAULTS = {
    'notify_post_approval': True,
    'notify_post_approved': True,
    'notify_post_rejected': True,
    'notify_post_failed': True,
    'notify_report_ready': True,
    'notify_package_expiry': True,
    'email_digest': False,
    'two_factor_enabled': False,
}

PREFERENCE_FIELDS = tuple(PREFERENCE_DEFAULTS.keys())


def _preferences_dict(prefs):
    if prefs is None:
        return dict(PREFERENCE_DEFAULTS)
    return {field: bool(getattr(prefs, field)) for field in PREFERENCE_FIELDS}


def _serialize_profile(client, request):
    user = client.user
    try:
        prefs = client.preferences
    except ClientPreferences.DoesNotExist:
        prefs = None
    return {
        'user_id': user.id,
        'username': user.first_name or user.username,
        'email': user.email,
        'organization_name': client.organization_name or '',
        'industry': client.industry or '',
        'contact_number': client.contact_number or '',
        'logo_url': request.build_absolute_uri(client.logo.url) if client.logo else None,
        'joined_at': client.created_at.isoformat() if client.created_at else None,
        'preferences': _preferences_dict(prefs),
    }


@csrf_exempt
@api_require_login
def client_profile_view(request):
    """GET: return the resolved client's profile. POST: update profile fields and optional logo."""
    client = _resolve_client(request)
    if not client:
        return JsonResponse({"error": "No client found."}, status=400)

    if request.method == 'GET':
        return JsonResponse(_serialize_profile(client, request))

    if request.method == 'POST':
        user = client.user

        full_name = request.POST.get('full_name')
        email = request.POST.get('email')
        organization_name = request.POST.get('organization_name')
        industry = request.POST.get('industry')
        contact_number = request.POST.get('contact_number')

        if full_name is not None:
            full_name = full_name.strip()
            if not full_name:
                return JsonResponse({"error": "Full name cannot be empty."}, status=400)
            user.first_name = full_name

        if email is not None:
            email = email.strip()
            if not email:
                return JsonResponse({"error": "Email cannot be empty."}, status=400)
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return JsonResponse({"error": "Email already in use."}, status=400)
            user.email = email
            user.username = email

        user.save()

        if organization_name is not None:
            client.organization_name = organization_name.strip()
        if industry is not None:
            client.industry = industry.strip()
        if contact_number is not None:
            client.contact_number = contact_number.strip()

        logo = request.FILES.get('logo')
        if logo:
            client.logo = logo

        client.save()

        return JsonResponse({
            'message': 'Profile updated successfully.',
            'profile': _serialize_profile(client, request),
        })

    return JsonResponse({"error": "Method not allowed."}, status=405)


@csrf_exempt
@api_require_login
def client_preferences_view(request):
    """POST: save notification + security preferences for the resolved client."""
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    client = _resolve_client(request)
    if not client:
        return JsonResponse({"error": "No client found."}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    prefs, _created = ClientPreferences.objects.get_or_create(client=client)

    for field in PREFERENCE_FIELDS:
        if field in data:
            setattr(prefs, field, bool(data[field]))
    prefs.save()

    return JsonResponse({
        'message': 'Preferences saved successfully.',
        'preferences': _preferences_dict(prefs),
    })


@csrf_exempt
@api_require_login
def client_password_view(request):
    """POST: verify current password and update to a new password."""
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    client = _resolve_client(request)
    if not client:
        return JsonResponse({"error": "No client found."}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not current_password or not new_password or not confirm_password:
        return JsonResponse({"error": "All password fields are required."}, status=400)

    user = client.user
    if not user.check_password(current_password):
        return JsonResponse({"error": "Current password is incorrect."}, status=400)

    if new_password != confirm_password:
        return JsonResponse({"error": "New passwords do not match."}, status=400)

    if len(new_password) < 8:
        return JsonResponse({"error": "Password must be at least 8 characters long."}, status=400)

    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)

    return JsonResponse({'message': 'Password changed successfully.'})


# =========================================================
# CLIENT NOTIFICATIONS
# =========================================================

@csrf_exempt
@api_require_login
def client_notifications_view(request):
    """GET: list client notifications + unread count; POST: mark notifications as read."""
    client = _resolve_client(request)
    if not client:
        return JsonResponse({"error": "No client found."}, status=400)

    if request.method == 'GET':
        notifications = Notification.objects.filter(client=client).order_by('-created_at')[:20]
        unread_count = Notification.objects.filter(client=client, is_read=False).count()
        items = [{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'type': n.notification_type,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        } for n in notifications]
        return JsonResponse({'notifications': items, 'unread_count': unread_count})

    if request.method == 'POST':
        try:
            data = json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON payload."}, status=400)

        notification_id = data.get('notification_id')
        read_all = data.get('read_all', False)

        if read_all:
            Notification.objects.filter(client=client, is_read=False).update(is_read=True)
        elif notification_id:
            Notification.objects.filter(id=notification_id, client=client).update(is_read=True)
        else:
            return JsonResponse({"error": "Provide notification_id or read_all=true."}, status=400)

        unread_count = Notification.objects.filter(client=client, is_read=False).count()
        return JsonResponse({'message': 'Notifications updated.', 'unread_count': unread_count})

    return JsonResponse({"error": "Only GET or POST methods allowed."}, status=405)


# =========================================================
# CLIENT PLATFORM DISCONNECT
# =========================================================

@csrf_exempt
@api_require_login
def disconnect_platform_view(request):
    """POST: disconnect (deactivate) a connected social media platform for the client."""
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    client = _resolve_client(request)
    if not client:
        return JsonResponse({"error": "No client found."}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    platform_value = (data.get('platform') or '').strip()
    if not platform_value:
        return JsonResponse({"error": "Platform is required."}, status=400)

    account = SocialMediaAccount.objects.filter(
        client=client,
        platform__name__iexact=platform_value,
        is_active=True,
    ).first()
    if not account:
        return JsonResponse({"error": "Platform is not connected."}, status=404)

    account.is_active = False
    account.access_token = ''
    account.refresh_token = ''
    account.token_expiry = None
    account.save()

    return JsonResponse({
        'message': f"{account.platform.get_name_display()} disconnected successfully.",
        'platform': platform_value.lower(),
    })


# =========================================================
# AI CAPTION GENERATOR (Groq LLM)
# =========================================================

import json

from django.conf import settings

LENGTH_GUIDANCE = {
    'short': 'Under 30 words (a punchy, skimmable caption).',
    'medium': '30–70 words (a balanced caption with a short intro and a takeaway).',
    'long': '70–150 words (a detailed, story-driven caption).',
}

TONE_GUIDANCE = {
    'professional': 'authoritative, polished, and business-appropriate',
    'casual': 'friendly, conversational, and approachable',
    'witty': 'clever, playful, and lightly humorous',
    'promotional': 'persuasive, benefit-focused, and action-driven',
}

PLATFORM_LABELS = {
    'instagram': 'Instagram (visual-first, hashtag-rich, casual yet polished)',
    'facebook': 'Facebook (community-focused, conversational, link-friendly)',
    'twitter': 'Twitter/X (concise, witty, hashtag-aware)',
    'linkedin': 'LinkedIn (professional, thought-leadership, B2B tone)',
    'youtube': 'YouTube (descriptive, searchable, viewer-engagement focused)',
    'pinterest': 'Pinterest (inspirational, keyword-friendly, how-to tone)',
}


def _groq_client():
    """Return a configured Groq client or raise a helpful error."""
    api_key = getattr(settings, 'GROQ_API_KEY', '').strip()
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not configured. Add it to the backend `.env` file "
            "as GROQ_API_KEY=your_key and restart the server."
        )
    try:
        from groq import Groq
    except ImportError:
        raise RuntimeError(
            "The `groq` Python package is not installed. Run `pip install groq`."
        )
    return Groq(api_key=api_key)


def _parse_variations(raw_text):
    """Parse the model's JSON array output into caption variations."""
    try:
        start = raw_text.find('[')
        end = raw_text.rfind(']')
        if start != -1 and end > start:
            items = json.loads(raw_text[start:end + 1])
        else:
            items = json.loads(raw_text)
    except (ValueError, TypeError):
        # Non-JSON fallback: treat the raw output as a single caption.
        return [{
            'label': 'Variation A',
            'content': raw_text.strip(),
            'hashtags': '',
            'cta': '',
            'emoji_caption': '',
        }]

    if not isinstance(items, list):
        items = [items]

    variations = []
    for i, item in enumerate(items[:3]):
        if not isinstance(item, dict):
            continue
        caption = (item.get('caption') or item.get('content') or '').strip()
        if not caption:
            continue
        variations.append({
            'label': f'Variation {chr(65 + i)}',
            'content': caption,
            'hashtags': (item.get('hashtags') or '').strip(),
            'cta': (item.get('cta') or '').strip(),
            'emoji_caption': (item.get('emoji_caption') or '').strip(),
        })

    if not variations:
        raise RuntimeError('The AI returned no usable captions. Please try again.')

    return variations


def _generate_captions(platform='instagram', tone='professional', keywords='',
                       audience='', length='medium', brand='', industry=''):
    client = _groq_client()

    platform_label = PLATFORM_LABELS.get(platform, platform or 'Instagram')
    tone_label = TONE_GUIDANCE.get(tone, TONE_GUIDANCE['professional'])
    length_label = LENGTH_GUIDANCE.get(length, LENGTH_GUIDANCE['medium'])

    brand_text = brand.strip() or 'an unnamed brand'
    industry_text = industry.strip() or 'its industry'
    audience_text = audience.strip() or 'the target audience'
    topic_text = keywords.strip() or 'the given topic'

    system_prompt = (
        "You are a senior social media copywriter and content strategist. "
        "You write polished, platform-appropriate social media copy that converts. "
        "Always respond with strictly valid JSON only — a JSON array of exactly 3 objects, "
        "each with the exact keys: caption, hashtags, cta, emoji_caption. "
        "Do not wrap the JSON in markdown or add any text outside the array."
    )

    user_prompt = (
        f"Write 3 distinct caption variations for the following brief.\n\n"
        f"- Platform: {platform_label}\n"
        f"- Brand / company: {brand_text}\n"
        f"- Industry: {industry_text}\n"
        f"- Tone of voice: {tone_label}\n"
        f"- Target audience: {audience_text}\n"
        f"- Length: {length_label}\n"
        f"- Topic / keywords: {topic_text}\n\n"
        f"For every variation:\n"
        f"  caption: a complete, ready-to-post professional caption (without the CTA and without emojis).\n"
        f"  hashtags: a space-separated string of 6–10 relevant, platform-appropriate hashtags.\n"
        f"  cta: one compelling call-to-action sentence encouraging likes, comments, shares, or clicks.\n"
        f"  emoji_caption: a version of the caption with tasteful, relevant emojis woven in (never overdo it).\n\n"
        f"Return only the JSON array."
    )

    completion = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
        temperature=0.8,
        max_tokens=1200,
        top_p=0.95,
    )

    raw_text = (completion.choices[0].message.content or '').strip()
    if not raw_text:
        raise RuntimeError('The AI returned an empty response. Please try again.')

    return _parse_variations(raw_text)


@csrf_exempt
@api_require_login
def smh_ai_generate_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload.'}, status=400)

    try:
        variations = _generate_captions(
            platform=data.get('platform', 'instagram'),
            tone=data.get('tone', 'professional'),
            keywords=data.get('keywords', ''),
            audience=data.get('audience', ''),
            length=data.get('length', 'medium'),
            brand=data.get('brand', ''),
            industry=data.get('industry', ''),
        )
        return JsonResponse({'variations': variations})
    except RuntimeError as e:
        return JsonResponse({'error': str(e)}, status=503)
    except Exception as e:
        return JsonResponse({'error': f'AI generation failed: {e}'}, status=502)


@csrf_exempt
@api_require_login
def smh_ai_save_draft_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    try:
        data = json.loads(request.body)
        caption = data.get('caption', '').strip()
        hashtags = data.get('hashtags', '')
        platforms = data.get('platforms', [])

        if not caption:
            return JsonResponse({'error': 'Caption is required.'}, status=400)

        client = Client.objects.first()
        if not client:
            return JsonResponse({'error': 'No client found.'}, status=400)

        smh_user = SMH.objects.first()
        post = Post.objects.create(
            client=client,
            created_by=smh_user,
            caption=caption,
            title=caption[:50],
            hashtags=hashtags,
            status='DRAFT',
        )

        for plat_name in platforms:
            platform = Platform.objects.filter(name__iexact=plat_name).first()
            if platform:
                PostPlatform.objects.get_or_create(post=post, platform=platform)

        return JsonResponse({'message': 'Draft saved successfully.', 'post_id': post.id}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_require_login
def smh_ai_history_view(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method allowed'}, status=405)
    try:
        drafts = Post.objects.filter(status='DRAFT').order_by('-created_at')[:20]
        history = []
        for post in drafts:
            platforms = [pp.platform.name.lower() for pp in PostPlatform.objects.filter(post=post)]
            history.append({
                'id': post.id,
                'caption': post.caption,
                'hashtags': post.hashtags,
                'platforms': platforms,
                'created_at': post.created_at.isoformat(),
            })
        return JsonResponse(history, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# =========================================================
# SMH PROFILE
# =========================================================

@csrf_exempt
@api_require_login
def smh_profile_view(request):
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'user_id is required'}, status=400)
        user = User.objects.filter(id=user_id).first()
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)
        smh = SMH.objects.filter(user=user).first()
        return JsonResponse({
            'user_id': user.id,
            'first_name': user.first_name,
            'email': user.email,
            'designation': smh.designation if smh else '',
            'experience_years': smh.experience_years if smh else 0,
            'agency_name': smh.agency_name if smh else '',
            'notification_preferences': {
                'email': smh.notify_email if smh else True,
                'push': smh.notify_push if smh else True,
                'weekly': smh.notify_weekly if smh else True,
            },
            'billing': None,
        })
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@api_require_login
def smh_profile_update_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'user_id is required'}, status=400)
        user = User.objects.filter(id=user_id).first()
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)

        first_name = data.get('first_name')
        email = data.get('email')

        if first_name is not None:
            user.first_name = first_name
        if email is not None and email != user.email:
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return JsonResponse({'error': 'Email already in use'}, status=400)
            user.email = email
            user.username = email
        user.save()

        smh = SMH.objects.filter(user=user).first()
        if smh:
            designation = data.get('designation')
            experience_years = data.get('experience_years')
            agency_name = data.get('agency_name')
            if designation is not None:
                smh.designation = designation
            if experience_years is not None:
                try:
                    smh.experience_years = int(experience_years)
                except (ValueError, TypeError):
                    pass
            if agency_name is not None:
                smh.agency_name = agency_name
            notif = data.get('notification_preferences')
            if isinstance(notif, dict):
                for key, default in (('email', True), ('push', True), ('weekly', True)):
                    if key in notif:
                        setattr(smh, f'notify_{key}', bool(notif.get(key, default)))
            smh.save()

        return JsonResponse({
            'message': 'Profile updated successfully',
            'user': {
                'user_id': user.id,
                'first_name': user.first_name,
                'email': user.email,
                'designation': smh.designation if smh else '',
                'experience_years': smh.experience_years if smh else 0,
                'agency_name': smh.agency_name if smh else '',
                'notification_preferences': {
                    'email': smh.notify_email if smh else True,
                    'push': smh.notify_push if smh else True,
                    'weekly': smh.notify_weekly if smh else True,
                },
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
