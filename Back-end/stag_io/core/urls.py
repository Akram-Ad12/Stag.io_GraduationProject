"""URL mappings for shared core notification endpoints."""
from django.urls import path
from core import notification_views

urlpatterns = [
    path(
        '',
        notification_views.MyNotificationListView.as_view(),
        name='notification-list',
    ),
    path(
        'unread/',
        notification_views.MyUnreadNotificationListView.as_view(),
        name='notification-unread',
    ),
    path(
        'read-all/',
        notification_views.MarkAllNotificationsReadView.as_view(),
        name='notification-read-all',
    ),
    path(
        '<int:pk>/read/',
        notification_views.MarkNotificationReadView.as_view(),
        name='notification-read',
    ),
]