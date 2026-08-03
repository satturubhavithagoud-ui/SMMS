"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from client.views import (
    signup_view,
    login_view,
    get_platforms,
    posts_view,
    connected_platforms_view,
    oauth_initiate_view,
    oauth_callback_view,
    refresh_token_view,
    smh_dashboard_summary_view,
    smh_clients_view,
    smh_content_queue_view,
    smh_analytics_view,
    post_detail_view,
    post_publish_view,
    post_retry_view,
    post_edit_view,
    client_dashboard_view,
    client_analytics_view,
    client_profile_view,
    client_preferences_view,
    client_password_view,
    client_notifications_view,
    disconnect_platform_view,
    smh_ai_generate_view,
    smh_ai_save_draft_view,
    smh_ai_history_view,
    smh_profile_view,
    smh_profile_update_view,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/signup/', signup_view),
    path('api/login/', login_view),
    path('api/platforms/', get_platforms),
    path('api/connected-platforms/', connected_platforms_view),
    path('api/posts/', posts_view),

    # SMH Portal Endpoints
    path('api/smh/dashboard/summary/', smh_dashboard_summary_view),
    path('api/smh/clients/', smh_clients_view),
    path('api/smh/content-queue/', smh_content_queue_view),
    path('api/smh/analytics/', smh_analytics_view),

    # Individual Post Operations
    path('api/posts/<int:post_id>/', post_detail_view),
    path('api/posts/<int:post_id>/publish/', post_publish_view),
    path('api/posts/<int:post_id>/retry/', post_retry_view),
    path('api/posts/<int:post_id>/edit/', post_edit_view),

    # Client Dashboard
    path('api/client/dashboard/', client_dashboard_view),

    # Client Analytics
    path('api/client/analytics/', client_analytics_view),

    # Client Settings
    path('api/client/profile/', client_profile_view),
    path('api/client/preferences/', client_preferences_view),
    path('api/client/change-password/', client_password_view),

    # Client Notifications & Platform Disconnect
    path('api/client/notifications/', client_notifications_view),
    path('api/client/platforms/disconnect/', disconnect_platform_view),

    # AI Studio endpoints
    path('api/smh/ai/generate/', smh_ai_generate_view),
    path('api/smh/ai/save-draft/', smh_ai_save_draft_view),
    path('api/smh/ai/history/', smh_ai_history_view),

    # SMH Profile endpoints
    path('api/smh/profile/', smh_profile_view),
    path('api/smh/profile/update/', smh_profile_update_view),

    # OAuth endpoints
    path('api/oauth/initiate/', oauth_initiate_view),
    path('api/oauth/callback/', oauth_callback_view),
    path('api/oauth/refresh/', refresh_token_view),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

