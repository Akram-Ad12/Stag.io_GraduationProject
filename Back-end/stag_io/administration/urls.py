"""URL mappings for the administration API."""
from django.urls import path

from administration import views

app_name = 'administration'

urlpatterns = [
    # Notifications
    path(
        'notifications/',
        views.NotificationListView.as_view(),
        name='notification-list',
    ),
    path(
        'notifications/unread/',
        views.UnreadNotificationListView.as_view(),
        name='notification-unread',
    ),
    path(
        'notifications/<int:pk>/read/',
        views.MarkNotificationReadView.as_view(),
        name='notification-read',
    ),
    # Internships
    path(
        'internships/',
        views.AllInternshipListView.as_view(),
        name='internship-list',
    ),
    path(
        'internships/<int:pk>/',
        views.InternshipDetailView.as_view(),
        name='internship-detail',
    ),
    path(
        'internships/<int:pk>/agreement/',
        views.DownloadInternshipAgreementView.as_view(),
        name='internship-agreement-download',
    ),
    path(
        'internships/<int:pk>/validate/',
        views.ValidateInternshipView.as_view(),
        name='internship-validate',
    ),
    path(
        'internships/<int:pk>/reject/',
        views.RejectInternshipView.as_view(),
        name='internship-reject',
    ),
    # Statistics
    path(
        'statistics/',
        views.StatisticsSummaryView.as_view(),
        name='statistics-summary',
    ),
    path(
        'statistics/companies/',
        views.StatisticsCompaniesView.as_view(),
        name='statistics-companies',
    ),
    path(
        'statistics/wilayas/',
        views.StatisticsWilayasView.as_view(),
        name='statistics-wilayas',
    ),
    path(
        'statistics/trends/',
        views.StatisticsTrendsView.as_view(),
        name='statistics-trends',
    ),
    path(
        'statistics/agreements/',
        views.StatisticsAgreementsView.as_view(),
        name='statistics-agreements',
    ),
    path(
        'statistics/statuses/',
        views.StatisticsStatusesView.as_view(),
        name='statistics-statuses',
    ),
    path(
        'statistics/students/',
        views.StatisticsStudentsView.as_view(),
        name='statistics-students',
    ),
    path(
        'statistics/companies/<int:company_id>/',
        views.StatisticsCompanyDetailView.as_view(),
        name='statistics-company-detail',
    ),
    # Mark all admin notifications as read
    path(
        'notifications/mark-all-read/',
        views.MarkAllAdminNotificationsReadView.as_view(),
        name='notifications-mark-all-read',
    ),
    # Reset data
    path(
        'reset-data/',
        views.AdminResetDataView.as_view(),
        name='admin-reset-data',
    ),
    # Public endpoints (no auth)
    path(
        'public/companies/',
        views.PublicCompanyListView.as_view(),
        name='public-companies',
    ),
    path(
        'public/offers/',
        views.PublicOfferListView.as_view(),
        name='public-offers',
    ),
]
