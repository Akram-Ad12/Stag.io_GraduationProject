"""
Shared notification views used by both student and company.
Since notifications now go to any User, we can reuse the same
views for all roles — just filter by the logged-in user.
"""
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

from core.models import Notification
from administration.serializers import NotificationSerializer


@extend_schema(tags=['Notifications'])
class MyNotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Returns all notifications for the logged-in user (any role).
    """
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
        ).select_related(
            'internship',
            'internship__student',
            'internship__company',
        )


@extend_schema(tags=['Notifications'])
class MyUnreadNotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/unread/
    Returns only unread notifications for the logged-in user.
    """
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
            is_read=False,
        ).select_related(
            'internship',
            'internship__student',
            'internship__company',
        )


@extend_schema(tags=['Notifications'])
class MarkNotificationReadView(APIView):
    """
    PATCH /api/notifications/<id>/read/
    Mark a single notification as read.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: NotificationSerializer, 404: OpenApiTypes.OBJECT})
    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(
                pk=pk, recipient=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {'detail': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        notification.is_read = True
        notification.save()
        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Notifications'])
class MarkAllNotificationsReadView(APIView):
    """
    PATCH /api/notifications/read-all/
    Mark ALL notifications as read in one call.
    Useful for a 'Mark all as read' button in the UI.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response(
            {'detail': f'{count} notifications marked as read.'},
            status=status.HTTP_200_OK,
        )