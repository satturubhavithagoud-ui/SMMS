from django.db import models
from django.contrib.auth.models import User


# 🔷 Client Model
class Client(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')

    organization_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.organization_name


# 🔷 SMH Model (Social Media Handler)
class SMH(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='smh_profile')

    designation = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username




class Platform(models.Model):
    PLATFORM_CHOICES = [
        ('INSTAGRAM', 'Instagram'),
        ('FACEBOOK', 'Facebook'),
        ('TWITTER', 'Twitter'),
        ('LINKEDIN', 'LinkedIn'),
        ('YOUTUBE', 'YouTube'),
        ('PINTEREST', 'Pinterest'),
    ]

    name = models.CharField(max_length=50, choices=PLATFORM_CHOICES, unique=True)

    def __str__(self):
        return self.name


# 🔷 Client Selected Platforms (checkbox data)
class ClientPlatform(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='platforms')
    platform = models.ForeignKey(Platform, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('client', 'platform')

    def __str__(self):
        return f"{self.client.user.email} → {self.platform.name}"