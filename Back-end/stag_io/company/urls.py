"""URL mappings for the company app."""
from django.urls import path
from company import views

app_name = 'company'

urlpatterns = [
    # Offer management
    path(
        'offers/',
        views.OfferListCreateView.as_view(),
        name='offer-list-create',
    ),
    path(
        'offers/<int:pk>/',
        views.OfferDetailView.as_view(),
        name='offer-detail',
    ),
    # Applicant management
    path(
        'offers/<int:pk>/applicants/',
        views.OfferApplicantListView.as_view(),
        name='offer-applicants',
    ),
    path(
        'applications/',
        views.AllApplicantsListView.as_view(),
        name='all-applications',
    ),
    path(
        'applications/<int:pk>/accept/',
        views.AcceptApplicantView.as_view(),
        name='application-accept',
    ),
    path(
        'applications/<int:pk>/reject/',
        views.RejectApplicantView.as_view(),
        name='application-reject',
    ),
    path(
        'applications/<int:pk>/document/',
        views.DownloadAgreementView.as_view(),
        name='application-document',
    ),
    # Statistics
    path(
        'stats/',
        views.CompanyStatsView.as_view(),
        name='company-stats',
    ),
    # Offer image upload
    path(
        'offers/<int:pk>/upload-image/',
        views.OfferImageUploadView.as_view(),
        name='offer-upload-image',
    ),
    # Reset data
    path(
        'reset-data/',
        views.CompanyResetDataView.as_view(),
        name='company-reset-data',
    ),
]