from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path

from user import views


TaggedTokenObtainPairView = extend_schema(tags=['Auth'])(
    TokenObtainPairView
)
TaggedTokenRefreshView = extend_schema(tags=['Auth'])(
    TokenRefreshView
)

app_name = 'user'

urlpatterns = [
    path(
        'register/student/',
        views.StudentRegisterView.as_view(),
        name='register-student',
    ),
    path(
        'register/company/',
        views.CompanyRegisterView.as_view(),
        name='register-company',
    ),
    path(
        'token/',
        TaggedTokenObtainPairView.as_view(),
        name='token-obtain',
    ),
    path(
        'token/refresh/',
        TaggedTokenRefreshView.as_view(),
        name='token-refresh',
    ),
    path(
        'me/',
        views.ManageUserView.as_view(),
        name='me',
    ),
    path(
        'me/student/',
        views.StudentUpdateView.as_view(),
        name='student-update',
    ),
    path(
        'me/company/',
        views.CompanyUpdateView.as_view(),
        name='company-update',
    ),
    path(
        '<int:pk>/delete/',
        views.AdminDeleteUserView.as_view(),
        name='admin-delete-user',
    ),
    path(
        'me/upload-logo/',
        views.CompanyLogoUploadView.as_view(),
        name='upload-logo',
    ),
    path(
        'me/upload-profile-image/',
        views.StudentProfileImageUploadView.as_view(),
        name='upload-profile-image',
    ),
    path(
        'universities/',
        views.UniversityListView.as_view(),
        name='university-list',
    ),
]
