"""URL mappings for the student app."""
from django.urls import path
from student import views

app_name = 'student'

urlpatterns = [
    # Skills
    path(
        'skills/',
        views.SkillListView.as_view(),
        name='skill-list',
    ),
    path(
        'me/skills/',
        views.MySkillListView.as_view(),
        name='my-skills',
    ),
    path(
        'me/skills/add/',
        views.AddSkillView.as_view(),
        name='add-skill',
    ),
    path(
        'me/skills/<int:pk>/remove/',
        views.RemoveSkillView.as_view(),
        name='remove-skill',
    ),
    # Offer search
    path(
        'offers/',
        views.StudentOfferListView.as_view(),
        name='offer-list',
    ),
    path(
        'offers/<int:pk>/',
        views.StudentOfferDetailView.as_view(),
        name='offer-detail',
    ),
    # Apply
    path(
        'offers/<int:pk>/apply/',
        views.ApplyToOfferView.as_view(),
        name='apply',
    ),
    # Applications
    path(
        'applications/',
        views.MyApplicationListView.as_view(),
        name='application-list',
    ),
    path(
        'applications/<int:pk>/',
        views.MyApplicationDetailView.as_view(),
        name='application-detail',
    ),
    path(
        'applications/<int:pk>/document/',
        views.DownloadAgreementView.as_view(),
        name='application-document',
    ),
    # Documents
    path(
        'documents/',
        views.MyDocumentListView.as_view(),
        name='document-list',
    ),
    # Digital CV
    path(
        'me/cv/',
        views.DigitalCVView.as_view(),
        name='digital-cv',
    ),
]