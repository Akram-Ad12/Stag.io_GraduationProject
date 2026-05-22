"""Permissions for the administration API."""
from rest_framework import permissions

from core.models import Admin


class IsAdminUser(permissions.BasePermission):
    """Allow access only to users with admin role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsAdminOfSameUniversity(permissions.BasePermission):
    """Admin can only access internships for students of their university."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role != 'admin':
            return False
        try:
            Admin.objects.get(pk=request.user.pk)
            return True
        except Admin.DoesNotExist:
            return False

    def has_object_permission(self, request, view, obj):
        try:
            admin = Admin.objects.get(pk=request.user.pk)
        except Admin.DoesNotExist:
            return False

        # obj is an Internship — check student's university
        if hasattr(obj, 'student') and hasattr(obj.student, 'university'):
            return obj.student.university == admin.university

        return False
