"""
URL configuration for samarth_backend project.

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
from rest_framework_simplejwt.views import TokenRefreshView

# App Views
from accounts import views as accounts_views
from roadmaps import views as roadmaps_views
from mentors import views as mentors_views

urlpatterns = [
    # Built-in django admin
    path('django-admin/', admin.site.urls),

    # Authentication & User Management
    path('api/auth/register/', accounts_views.RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', accounts_views.CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('api/auth/verify-email/<str:token>/', accounts_views.VerifyEmailView.as_view(), name='auth_verify_email'),
    path('api/auth/social/google/', accounts_views.GoogleLoginView.as_view(), name='auth_social_google'),
    path('api/auth/profile/', accounts_views.UserProfileView.as_view(), name='auth_profile'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile Custom Updates
    path('api/auth/profile/student/update/', accounts_views.StudentProfileUpdateView.as_view(), name='profile_student_update'),
    path('api/auth/profile/mentor/update/', accounts_views.MentorProfileUpdateView.as_view(), name='profile_mentor_update'),

    # Admin Dashboard Enforced Rules
    path('api/admin/users/', accounts_views.AdminUserListView.as_view(), name='admin_users_list'),
    path('api/admin/users/<int:pk>/verify-mentor/', accounts_views.AdminVerifyMentorView.as_view(), name='admin_verify_mentor'),
    path('api/admin/users/<int:pk>/toggle-active/', accounts_views.AdminToggleActiveView.as_view(), name='admin_toggle_active'),

    # Roadmaps AI
    path('api/roadmaps/generate/', roadmaps_views.RoadmapGenerateView.as_view(), name='roadmap_generate'),
    path('api/roadmaps/', roadmaps_views.RoadmapDetailView.as_view(), name='roadmap_detail'),
    path('api/roadmaps/milestone/<int:pk>/complete/', roadmaps_views.MilestoneCompleteView.as_view(), name='roadmap_milestone_complete'),
    path('api/roadmaps/regenerate/', roadmaps_views.RoadmapRegenerateView.as_view(), name='roadmap_regenerate'),

    # Mentors Discovery & Session Booking
    path('api/mentors/', mentors_views.MentorListView.as_view(), name='mentors_list'),
    path('api/mentors/<int:user_id>/', mentors_views.MentorDetailView.as_view(), name='mentor_detail'),
    path('api/mentors/book-session/', mentors_views.BookSessionView.as_view(), name='mentors_book_session'),
    path('api/mentors/sessions/', mentors_views.SessionListView.as_view(), name='mentors_sessions_list'),
    path('api/mentors/sessions/<int:pk>/confirm/', mentors_views.SessionConfirmView.as_view(), name='mentors_session_confirm'),
    path('api/mentors/sessions/<int:pk>/cancel/', mentors_views.SessionCancelView.as_view(), name='mentors_session_cancel'),
    path('api/mentors/sessions/<int:pk>/complete/', mentors_views.SessionCompleteView.as_view(), name='mentors_session_complete'),
]
