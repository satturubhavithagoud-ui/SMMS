from django.db import models
from django.contrib.auth.models import User



# =========================================================
# CLIENT MODEL
# =========================================================

class Client(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='client_profile'
    )

    organization_name = models.CharField(max_length=255, blank=True)

    industry = models.CharField(max_length=100, blank=True)

    contact_number = models.CharField(max_length=15, blank=True)

    logo = models.ImageField(
        upload_to='client_logos/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.username


# =========================================================
# SMH MODEL
# =========================================================

class SMH(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='smh_profile'
    )

    designation = models.CharField(max_length=100)

    experience_years = models.PositiveIntegerField(default=0)

    agency_name = models.CharField(max_length=120, blank=True, default='')

    notify_email = models.BooleanField(default=True)

    notify_push = models.BooleanField(default=True)

    notify_weekly = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)

    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


# =========================================================
# PLATFORM MODEL
# =========================================================

class Platform(models.Model):

    PLATFORM_CHOICES = [
        ('INSTAGRAM', 'Instagram'),
        ('FACEBOOK', 'Facebook'),
        ('TWITTER', 'Twitter'),
        ('LINKEDIN', 'LinkedIn'),
        ('YOUTUBE', 'YouTube'),
        ('PINTEREST', 'Pinterest'),
    ]

    name = models.CharField(
        max_length=50,
        choices=PLATFORM_CHOICES,
        unique=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.get_name_display()


# =========================================================
# CLIENT PLATFORM MODEL
# =========================================================

class ClientPlatform(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )

    platform = models.ForeignKey(
        Platform,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('client', 'platform')

    def __str__(self):
        return f"{self.client.user.username} - {self.platform.name}"


# =========================================================
# SOCIAL MEDIA ACCOUNT MODEL
# =========================================================

class SocialMediaAccount(models.Model):

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )

    platform = models.ForeignKey(
        Platform,
        on_delete=models.CASCADE
    )

    account_username = models.CharField(max_length=255)

    account_id = models.CharField(
        max_length=255,
        blank=True
    )

    access_token = models.TextField(blank=True)

    refresh_token = models.TextField(blank=True)

    token_expiry = models.DateTimeField(
        blank=True,
        null=True
    )

    is_active = models.BooleanField(default=True)

    connected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('client', 'platform')

    def __str__(self):
        return f"{self.client.user.username} - {self.platform.name}"


# =========================================================
# PACKAGE MODEL
# =========================================================

class Package(models.Model):

    DURATION_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    ]

    name = models.CharField(max_length=100)

    description = models.TextField(blank=True)

    duration = models.CharField(
        max_length=20,
        choices=DURATION_CHOICES
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    post_limit = models.PositiveIntegerField(default=0)

    platform_limit = models.PositiveIntegerField(default=1)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# =========================================================
# CLIENT SUBSCRIPTION MODEL
# =========================================================

class ClientSubscription(models.Model):

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )

    package = models.ForeignKey(
        Package,
        on_delete=models.CASCADE
    )

    start_date = models.DateField()

    end_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.user.username} - {self.package.name}"


# =========================================================
# POST MODEL
# =========================================================

class Post(models.Model):

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SCHEDULED', 'Scheduled'),
        ('POSTED', 'Posted'),
        ('FAILED', 'Failed'),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )

    created_by = models.ForeignKey(
        SMH,
        on_delete=models.SET_NULL,
        null=True
    )

    title = models.CharField(
        max_length=255,
        blank=True
    )

    caption = models.TextField()

    hashtags = models.TextField(blank=True)

    media = models.FileField(
        upload_to='post_media/',
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title if self.title else f"Post {self.id}"


# =========================================================
# POST PLATFORM MODEL
# =========================================================

class PostPlatform(models.Model):

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE
    )

    platform = models.ForeignKey(
        Platform,
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ('post', 'platform')

    def __str__(self):
        return f"{self.post.id} - {self.platform.name}"


# =========================================================
# POST APPROVAL MODEL
# =========================================================

class PostApproval(models.Model):

    APPROVAL_STATUS = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    post = models.OneToOneField(
        Post,
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS,
        default='PENDING'
    )

    reviewed_at = models.DateTimeField(
        blank=True,
        null=True
    )

    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.post.id} - {self.status}"


# =========================================================
# POST SCHEDULE MODEL
# =========================================================

class PostSchedule(models.Model):

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    post = models.OneToOneField(
        Post,
        on_delete=models.CASCADE
    )

    scheduled_time = models.DateTimeField()

    posted_time = models.DateTimeField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    failure_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.post.id} - {self.status}"


# =========================================================
# REPORT MODEL
# =========================================================

class Report(models.Model):

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )

    month = models.CharField(max_length=20)

    total_posts = models.PositiveIntegerField(default=0)

    total_reach = models.PositiveIntegerField(default=0)

    total_engagement = models.PositiveIntegerField(default=0)

    followers_gained = models.PositiveIntegerField(default=0)

    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.user.username} - {self.month}"


# =========================================================
# NOTIFICATION MODEL
# =========================================================

class Notification(models.Model):

    TYPE_CHOICES = [
        ('POST_APPROVAL', 'Post Approval'),
        ('POST_APPROVED', 'Post Approved'),
        ('POST_REJECTED', 'Post Rejected'),
        ('POST_FAILED', 'Post Failed'),
        ('PACKAGE_EXPIRY', 'Package Expiry'),
        ('REPORT_READY', 'Report Ready'),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    notification_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# =========================================================
# CLIENT PREFERENCES MODEL
# =========================================================

class ClientPreferences(models.Model):

    client = models.OneToOneField(
        Client,
        on_delete=models.CASCADE,
        related_name='preferences'
    )

    notify_post_approval = models.BooleanField(default=True)
    notify_post_approved = models.BooleanField(default=True)
    notify_post_rejected = models.BooleanField(default=True)
    notify_post_failed = models.BooleanField(default=True)
    notify_report_ready = models.BooleanField(default=True)
    notify_package_expiry = models.BooleanField(default=True)
    email_digest = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.client.user.username} preferences"

















'''
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

'''