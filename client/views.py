import json
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from .models import Client, Platform, ClientPlatform,SMH

@csrf_exempt
def signup_view(request):
    if request.method == "POST":
        data = json.loads(request.body)

        email = data.get("email")
        password = data.get("password")
        username = data.get("username")  # 👉 display name
        platforms = data.get("platforms", [])

        if not email or not password or not username:
            return JsonResponse({"error": "Missing fields"}, status=400)

        if User.objects.filter(username=email).exists():
            return JsonResponse({"error": "User already exists"}, status=400)

        # 🔷 create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        # 🔥 store REAL username here
        user.first_name = username
        user.save()

        # 🔷 create client
        client = Client.objects.create(
            user=user,
            organization_name="N/A"  # or ask later in form
        )

        # 🔷 assign platforms
        platform_objs = Platform.objects.filter(
            name__in=[p.upper() for p in platforms]
        )

        for p in platform_objs:
            ClientPlatform.objects.create(client=client, platform=p)

        return JsonResponse({
            "message": "Signup successful",
            "username": user.first_name
        })


@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)

        email = data.get("email")
        password = data.get("password")

        user = authenticate(username=email, password=password)

        if user:
            # 🔷 Determine role
            if Client.objects.filter(user=user).exists():
                role = "CLIENT"
            elif SMH.objects.filter(user=user).exists():
                role = "SMH"
            else:
                role = "UNKNOWN"

            return JsonResponse({
                "message": "Login success",
                "user_id": user.id,
                "role": role
            })

        else:
            return JsonResponse({"error": "Invalid credentials"}, status=400)


def get_platforms(request):
    data = []

    for p in Platform.objects.all():
        data.append({
            "id": p.id,
            "value": p.name,          # INSTAGRAM
            "label": p.get_name_display()  # Instagram
        })

    return JsonResponse(data, safe=False)