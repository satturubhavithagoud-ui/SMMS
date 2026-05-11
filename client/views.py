import json

from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt

from .models import (
    Client,
    SMH,
    Platform,
    ClientPlatform
)


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
        data = json.loads(request.body)

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
        data = json.loads(request.body)

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

        if Client.objects.filter(user=user).exists():
            role = "CLIENT"

        elif SMH.objects.filter(user=user).exists():
            role = "SMH"

        else:
            role = "UNKNOWN"

        return JsonResponse({
            "message": "Login successful",
            "user_id": user.id,
            "username": user.first_name,
            "email": user.email,
            "role": role
        })

    except Exception as e:
        return JsonResponse({
            "error": str(e)
        }, status=500)


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
