"""Views for the user API."""
from django.contrib.auth import get_user_model

from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.authentication import JWTAuthentication

from user.serializers import (
    StudentRegisterSerializer,
    CompanyRegisterSerializer,
    UserDetailSerializer,
    StudentUpdateSerializer,
    CompanyUpdateSerializer,
    LogoImageSerializer,
    ProfileImageSerializer,
)


class IsAdmin(permissions.BasePermission):
    """Allow access only to Django staff admins (is_staff=True)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class IsStudent(permissions.BasePermission):
    """Allow access only to student users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', '') == 'student'
        )


class IsCompany(permissions.BasePermission):
    """Allow access only to company users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', '') == 'company'
        )


@extend_schema(tags=['Student'])
class StudentRegisterView(generics.CreateAPIView):
    """Register a new student."""
    serializer_class = StudentRegisterSerializer


@extend_schema(tags=['Company'])
class CompanyRegisterView(generics.CreateAPIView):
    """Register a new company."""
    serializer_class = CompanyRegisterSerializer


@extend_schema(tags=['Account'])
class ManageUserView(generics.RetrieveUpdateAPIView):
    """Manage the authenticated user (GET /me, PATCH /me)."""
    serializer_class = UserDetailSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Return the authenticated user."""
        return self.request.user


@extend_schema(tags=['Superuser'])
class AdminDeleteUserView(generics.DestroyAPIView):
    """Allow an admin to delete any user by ID."""
    queryset = get_user_model().objects.all()
    serializer_class = UserDetailSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    lookup_field = 'pk'


@extend_schema(tags=['Student'])
class StudentUpdateView(generics.RetrieveUpdateAPIView):
    """View and update student profile (full_name, wilaya, links)."""
    serializer_class = StudentUpdateSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]
    http_method_names = ['get', 'patch']

    def get_object(self):
        from core.models import Student
        return Student.objects.get(pk=self.request.user.pk)


@extend_schema(tags=['Company'])
class CompanyUpdateView(generics.RetrieveUpdateAPIView):
    """View and update company profile (name, description, wilaya, website)."""
    serializer_class = CompanyUpdateSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]
    http_method_names = ['get', 'patch']

    def get_object(self):
        from core.models import Company
        return Company.objects.get(pk=self.request.user.pk)


@extend_schema(tags=['Company'])
class CompanyLogoUploadView(generics.UpdateAPIView):
    """Upload a logo image for the authenticated company user."""
    serializer_class = LogoImageSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['patch']

    def get_object(self):
        """Return the authenticated user's Company instance."""
        from core.models import Company
        return Company.objects.get(pk=self.request.user.pk)


@extend_schema(tags=['Student'])
class StudentProfileImageUploadView(generics.UpdateAPIView):
    """Upload a profile image for the authenticated student user."""
    serializer_class = ProfileImageSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['patch']

    def get_object(self):
        """Return the authenticated user's Student instance."""
        from core.models import Student
        return Student.objects.get(pk=self.request.user.pk)


@extend_schema(tags=['Public'])
class UniversityListView(generics.ListAPIView):
    """Public list of all universities (no authentication required).
    Used by the registration form and profile page."""
    from core.models import University
    from user.serializers import UniversitySerializer
    serializer_class = UniversitySerializer
    queryset = University.objects.all()