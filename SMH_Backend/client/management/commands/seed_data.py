import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from client.models import (
    Client,
    SMH,
    Platform,
    ClientPlatform,
    SocialMediaAccount,
    Package,
    ClientSubscription,
    Post,
    PostPlatform,
    PostSchedule,
    Report,
    Notification
)

class Command(BaseCommand):
    help = 'Seeds initial test data into the database'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding data...")

        # 1. Create platforms
        platforms_dict = {}
        for code, label in Platform.PLATFORM_CHOICES:
            p, created = Platform.objects.get_or_create(name=code)
            platforms_dict[code] = p
            if created:
                self.stdout.write(f"Created platform {label}")

        # 2. Create packages
        packages_data = [
            {"name": "Enterprise", "price": 499.00, "post_limit": 100, "platform_limit": 6},
            {"name": "Growth Pro", "price": 199.00, "post_limit": 50, "platform_limit": 4},
            {"name": "Standard", "price": 79.00, "post_limit": 20, "platform_limit": 2},
            {"name": "Free Tier", "price": 0.00, "post_limit": 5, "platform_limit": 1},
        ]
        packages_dict = {}
        for pk in packages_data:
            package, created = Package.objects.get_or_create(
                name=pk["name"],
                defaults={
                    "price": pk["price"],
                    "post_limit": pk["post_limit"],
                    "platform_limit": pk["platform_limit"],
                    "duration": "MONTHLY"
                }
            )
            packages_dict[pk["name"]] = package
            if created:
                self.stdout.write(f"Created package {pk['name']}")

        # 3. Handle existing Client user
        client_user = User.objects.filter(username='kothakondanagasree8@gmail.com').first()
        if not client_user:
            client_user = User.objects.create_user(
                username='kothakondanagasree8@gmail.com',
                email='kothakondanagasree8@gmail.com',
                password='password123',
                first_name='Nagasree'
            )
        
        client_profile, created = Client.objects.get_or_create(
            user=client_user,
            defaults={
                "organization_name": "Luxe Hotels Group",
                "industry": "Hospitality & Travel",
                "contact_number": "1234567890"
            }
        )
        if not created:
            client_profile.organization_name = "Luxe Hotels Group"
            client_profile.industry = "Hospitality & Travel"
            client_profile.save()

        # Subscribe existing client
        ClientSubscription.objects.get_or_create(
            client=client_profile,
            package=packages_dict["Enterprise"],
            defaults={
                "start_date": timezone.now().date() - datetime.timedelta(days=15),
                "end_date": timezone.now().date() + datetime.timedelta(days=15),
                "status": "ACTIVE"
            }
        )

        # Connect platforms for existing client
        for code in ["FACEBOOK", "INSTAGRAM", "LINKEDIN"]:
            ClientPlatform.objects.get_or_create(client=client_profile, platform=platforms_dict[code])
            SocialMediaAccount.objects.get_or_create(
                client=client_profile,
                platform=platforms_dict[code],
                defaults={
                    "account_username": f"luxe_hotels_{code.lower()}",
                    "account_id": f"id_{code.lower()}_123",
                    "access_token": "mock_token_abc_123",
                    "is_active": True
                }
            )

        # 4. Create secondary clients for testing
        clients_data = [
            {"username": "swifteats@company.com", "org": "SwiftEats Delivery", "ind": "Food & Beverage", "pkg": "Growth Pro", "plats": ["INSTAGRAM", "FACEBOOK"]},
            {"username": "techcore@company.com", "org": "TechCore Solutions", "ind": "Software & SaaS", "pkg": "Enterprise", "plats": ["LINKEDIN", "TWITTER"]},
            {"username": "vivid@company.com", "org": "Vivid Studios", "ind": "Creative Agency", "pkg": "Standard", "plats": ["INSTAGRAM"]},
        ]
        
        for cdata in clients_data:
            user, u_created = User.objects.get_or_create(
                username=cdata["username"],
                defaults={
                    "email": cdata["username"],
                    "first_name": cdata["org"].split()[0]
                }
            )
            if u_created:
                user.set_password("password123")
                user.save()
            
            c_profile, cp_created = Client.objects.get_or_create(
                user=user,
                defaults={
                    "organization_name": cdata["org"],
                    "industry": cdata["ind"]
                }
            )

            ClientSubscription.objects.get_or_create(
                client=c_profile,
                package=packages_dict[cdata["pkg"]],
                defaults={
                    "start_date": timezone.now().date() - datetime.timedelta(days=10),
                    "end_date": timezone.now().date() + datetime.timedelta(days=20),
                    "status": "ACTIVE"
                }
            )

            for code in cdata["plats"]:
                ClientPlatform.objects.get_or_create(client=c_profile, platform=platforms_dict[code])
                SocialMediaAccount.objects.get_or_create(
                    client=c_profile,
                    platform=platforms_dict[code],
                    defaults={
                        "account_username": f"{cdata['org'].lower().replace(' ', '_')}_{code.lower()}",
                        "account_id": f"id_{code.lower()}_456",
                        "is_active": True
                    }
                )

        # Get first SMH or create
        smh_user = User.objects.filter(username='nagasree').first()
        if not smh_user:
            smh_user = User.objects.create_user(
                username='nagasree',
                password='password123',
                first_name='Sarah Rogers'
            )
        smh_profile, _ = SMH.objects.get_or_create(
            user=smh_user,
            defaults={
                "designation": "Social Strategy Lead",
                "experience_years": 5,
                "is_active": True
            }
        )

        # 5. Create some dummy posts
        all_clients = Client.objects.all()
        post_templates = [
            {"title": "Framework Launch", "caption": "Unlocking Creative Potential: Our New Agency Framework! 🚀 We are excited to announce our newest initiative for Q4 content strategy. #Marketing #BrandStrategy", "status": "SCHEDULED", "offset": 1, "platform": "FACEBOOK"},
            {"title": "Instagram Secrets", "caption": "The Secret to Viral Instagram Reels in 2026. Watch our latest breakdown of the algorithm changes happening this week! 🎥✨ #Reels #Algorithm", "status": "POSTED", "offset": -1, "platform": "INSTAGRAM"},
            {"title": "Trust in Digital Era", "caption": "Building Trust in the Digital Era: A B2B Perspective. Our CEO shares insights on professional networking and brand authority. #LinkedIn #B2B", "status": "SCHEDULED", "offset": 2, "platform": "LINKEDIN"},
            {"title": "Monday Essentials", "caption": "Monday morning essentials. How do you start your week for maximum focus? ☕️🌿 #MondayMotivation #Focus", "status": "POSTED", "offset": -2, "platform": "INSTAGRAM"},
            {"title": "Brainstorming Session", "caption": "Behind the scenes of our latest brainstorm session. Great ideas are brewing! 🧠✨ #Teamwork #Creative", "status": "FAILED", "offset": -3, "platform": "FACEBOOK"},
        ]

        now = timezone.now()
        for idx, template in enumerate(post_templates):
            # cycle clients
            target_client = all_clients[idx % all_clients.count()]
            post, p_created = Post.objects.get_or_create(
                client=target_client,
                caption=template["caption"],
                defaults={
                    "title": template["title"],
                    "created_by": smh_profile,
                    "status": template["status"]
                }
            )
            
            PostPlatform.objects.get_or_create(post=post, platform=platforms_dict[template["platform"]])
            
            # Post schedule
            sched_time = now + datetime.timedelta(days=template["offset"])
            if template["status"] == "SCHEDULED":
                PostSchedule.objects.get_or_create(
                    post=post,
                    defaults={
                        "scheduled_time": sched_time,
                        "status": "PENDING"
                    }
                )
            elif template["status"] == "POSTED":
                PostSchedule.objects.get_or_create(
                    post=post,
                    defaults={
                        "scheduled_time": sched_time - datetime.timedelta(hours=1),
                        "posted_time": sched_time,
                        "status": "COMPLETED"
                    }
                )
            elif template["status"] == "FAILED":
                PostSchedule.objects.get_or_create(
                    post=post,
                    defaults={
                        "scheduled_time": sched_time,
                        "status": "FAILED",
                        "failure_reason": "API Authentication Error"
                    }
                )

        # 6. Create report data
        for client in all_clients:
            Report.objects.get_or_create(
                client=client,
                month="July 2026",
                defaults={
                    "total_posts": 14,
                    "total_reach": 245000,
                    "total_engagement": 12400,
                    "followers_gained": 1200
                }
            )

        self.stdout.write("Database seeded successfully!")
