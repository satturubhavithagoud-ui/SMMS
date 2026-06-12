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
from client.views import signup_view, login_view, get_platforms, posts_view, connected_platforms_view, oauth_initiate_view, oauth_callback_view, refresh_token_view, clients_view, smh_create_posts_view, youtube_analytics_view, post_detail_view, client_analytics_view, post_analytics_view, client_profile_view, disconnect_platform_view, smh_dashboard_view, smh_analytics_page_view, smh_settings_view, debug_post_view

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/signup/', signup_view),
    path('api/login/', login_view),
    path('api/platforms/', get_platforms),
    path('api/connected-platforms/', connected_platforms_view),
    path('api/posts/', posts_view),
    path('api/posts/<int:post_id>/', post_detail_view),
    path('api/clients/', clients_view),
    path('api/client-profile/', client_profile_view),
    path('api/disconnect-platform/', disconnect_platform_view),

    #path('api/smh_create_posts_view/', smh_create_posts_view),
    path('api/smh/posts/create/', smh_create_posts_view),#smh create post from scheduler for multiple users/clients
    path('api/smh/dashboard/', smh_dashboard_view),
    path('api/smh/analytics/', smh_analytics_page_view),
    path('api/smh/settings/', smh_settings_view),

    # OAuth endpoints
    path('api/oauth/initiate/', oauth_initiate_view),
    path('api/oauth/callback/', oauth_callback_view),
    path('api/oauth/refresh/', refresh_token_view),
    
    # Analytics
    path('api/analytics/youtube/', youtube_analytics_view),
    path('api/client-analytics/', client_analytics_view),
    path('api/posts/<int:post_id>/analytics/', post_analytics_view),
    path('api/debug/post/<int:post_id>/', debug_post_view),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
