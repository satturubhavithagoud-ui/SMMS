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