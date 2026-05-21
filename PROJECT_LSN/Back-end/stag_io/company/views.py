"""Views for the company internship offer and applicant management API."""
from datetime import date
from django.http import FileResponse
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from core.models import Company, InternshipOffer, Internship
from core.notifications import (
    notify_admins_internship_accepted,
    notify_student_accepted,
    notify_student_rejected,
)
from company.serializers import (
    InternshipOfferSerializer,
    CreateInternshipOfferSerializer,
    UpdateInternshipOfferSerializer,
    ApplicantSerializer,
)
from user.views import IsCompany


def get_company(request):
    """Get the Company object for the currently logged-in user."""
    return Company.objects.get(pk=request.user.pk)


# ── Offer views ──────────────────────────────────────────────────────

@extend_schema(tags=['Company Offers'])
class OfferListCreateView(APIView):
    """
    GET  /api/company/offers/ — list this company's offers
    POST /api/company/offers/ — create a new offer
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(responses={200: InternshipOfferSerializer(many=True)})
    def get(self, request):
        company = get_company(request)
        offers = InternshipOffer.objects.filter(company=company)
        serializer = InternshipOfferSerializer(
            offers, many=True, context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=CreateInternshipOfferSerializer,
        responses={201: InternshipOfferSerializer},
    )
    def post(self, request):
        serializer = CreateInternshipOfferSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        company = get_company(request)
        offer = serializer.save(company=company)
        return Response(
            InternshipOfferSerializer(
                offer, context={'request': request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Company Offers'])
class OfferDetailView(APIView):
    """
    GET    /api/company/offers/<id>/ — view a specific offer
    PATCH  /api/company/offers/<id>/ — modify an offer
    DELETE /api/company/offers/<id>/ — delete an offer
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_offer(self, pk, company):
        try:
            return InternshipOffer.objects.get(pk=pk, company=company)
        except InternshipOffer.DoesNotExist:
            return None

    @extend_schema(responses={200: InternshipOfferSerializer})
    def get(self, request, pk):
        company = get_company(request)
        offer = self.get_offer(pk, company)
        if not offer:
            return Response(
                {'detail': 'Offer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = InternshipOfferSerializer(
            offer, context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=UpdateInternshipOfferSerializer,
        responses={200: InternshipOfferSerializer},
    )
    def patch(self, request, pk):
        company = get_company(request)
        offer = self.get_offer(pk, company)
        if not offer:
            return Response(
                {'detail': 'Offer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Auto-close the offer if its start date has already passed
        if (
            offer.status == InternshipOffer.Status.OPEN
            and offer.start_date <= date.today()
        ):
            offer.status = InternshipOffer.Status.CLOSED
            offer.save(update_fields=['status'])

        serializer = UpdateInternshipOfferSerializer(
            offer, data=request.data, partial=True,
        )
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        offer = serializer.save()
        return Response(
            InternshipOfferSerializer(
                offer, context={'request': request},
            ).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(responses={204: None})
    def delete(self, request, pk):
        company = get_company(request)
        offer = self.get_offer(pk, company)
        if not offer:
            return Response(
                {'detail': 'Offer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        offer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Applicant management views ───────────────────────────────────────

@extend_schema(tags=['Company Applicants'])
class OfferApplicantListView(generics.ListAPIView):
    """
    GET /api/company/offers/<id>/applicants/
    List all students who applied to one of this company's offers.
    """
    serializer_class = ApplicantSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]

    def get_queryset(self):
        company = get_company(self.request)
        offer_id = self.kwargs['pk']
        try:
            offer = InternshipOffer.objects.get(pk=offer_id, company=company)
        except InternshipOffer.DoesNotExist:
            return Internship.objects.none()
        return Internship.objects.filter(
            offer=offer,
        ).select_related(
            'student', 'offer',
        ).prefetch_related(
            'student__student_skills__skill',
        ).order_by('-created_at')


@extend_schema(tags=['Company Applicants'])
class AllApplicantsListView(generics.ListAPIView):
    """
    GET /api/company/applications/
    List all students who applied to any of this company's offers.
    """
    serializer_class = ApplicantSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]

    def get_queryset(self):
        company = get_company(self.request)
        return Internship.objects.filter(
            company=company,
        ).select_related(
            'student', 'offer',
        ).prefetch_related(
            'student__student_skills__skill',
        ).order_by('-created_at')


@extend_schema(tags=['Company Applicants'])
class AcceptApplicantView(APIView):
    """
    POST /api/company/applications/<id>/accept/
    Company accepts a student. Notifies student and all university admins.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT})
    def post(self, request, pk):
        company = get_company(request)
        try:
            application = Internship.objects.select_related(
                'student', 'student__university', 'company', 'offer',
            ).get(pk=pk, company=company)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if application.status != Internship.Status.PENDING:
            return Response(
                {
                    'detail': (
                        f'Cannot accept this application. '
                        f'Current status is: {application.status}'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.status = Internship.Status.ACCEPTED_BY_COMPANY
        application.save()

        # Notify student they were accepted
        notify_student_accepted(application)
        # Notify all admins of the student's university
        notify_admins_internship_accepted(application)

        return Response(
            {
                'detail': 'Application accepted. Student and university notified.',
                'application_id': application.id,
                'status': application.status,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Company Applicants'])
class RejectApplicantView(APIView):
    """
    POST /api/company/applications/<id>/reject/
    Company rejects a student's application. Notifies the student.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT})
    def post(self, request, pk):
        company = get_company(request)
        try:
            application = Internship.objects.select_related(
                'student', 'company', 'offer',
            ).get(pk=pk, company=company)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if application.status != Internship.Status.PENDING:
            return Response(
                {
                    'detail': (
                        f'Cannot reject this application. '
                        f'Current status is: {application.status}'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.status = Internship.Status.REJECTED
        application.save()

        # Notify student they were rejected
        notify_student_rejected(application)

        return Response(
            {
                'detail': 'Application rejected. Student has been notified.',
                'application_id': application.id,
                'status': application.status,
            },
            status=status.HTTP_200_OK,
        )


# ── Statistics views ─────────────────────────────────────────────────

@extend_schema(tags=['Company Stats'])
class CompanyStatsView(APIView):
    """
    GET /api/company/stats/
    Aggregated statistics for the company dashboard.
    Returns overall counts and per-offer breakdowns.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        company = get_company(request)
        internships = Internship.objects.filter(company=company)

        overall = {
            'total': internships.count(),
            'pending': internships.filter(
                status=Internship.Status.PENDING,
            ).count(),
            'accepted': internships.filter(
                status=Internship.Status.ACCEPTED_BY_COMPANY,
            ).count(),
            'validated': internships.filter(
                status=Internship.Status.VALIDATED,
            ).count(),
            'rejected': internships.filter(
                status=Internship.Status.REJECTED,
            ).count(),
        }

        offers = InternshipOffer.objects.filter(company=company)
        offers_data = []
        for offer in offers:
            apps = internships.filter(offer=offer)
            offers_data.append({
                'offer_id': offer.id,
                'offer_title': offer.title,
                'total': apps.count(),
                'pending': apps.filter(
                    status=Internship.Status.PENDING,
                ).count(),
                'accepted': apps.filter(
                    status=Internship.Status.ACCEPTED_BY_COMPANY,
                ).count(),
                'validated': apps.filter(
                    status=Internship.Status.VALIDATED,
                ).count(),
                'rejected': apps.filter(
                    status=Internship.Status.REJECTED,
                ).count(),
            })

        return Response(
            {'overall': overall, 'offers': offers_data},
            status=status.HTTP_200_OK,
        )


# ── Offer image upload ───────────────────────────────────────────────

@extend_schema(tags=['Company Offers'])
class OfferImageUploadView(APIView):
    """
    PATCH /api/company/offers/<id>/upload-image/
    Upload or replace the photo for an offer.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, pk):
        company = get_company(request)
        try:
            offer = InternshipOffer.objects.get(pk=pk, company=company)
        except InternshipOffer.DoesNotExist:
            return Response(
                {'detail': 'Offer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        image = request.FILES.get('image')
        if not image:
            return Response(
                {'detail': 'No image file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        offer.photo = image
        offer.save(update_fields=['photo'])
        return Response(
            {'detail': 'Image uploaded.', 'photo': offer.photo.url},
            status=status.HTTP_200_OK,
        )


# ── Reset data ───────────────────────────────────────────────────────

@extend_schema(tags=['Company'])
class CompanyResetDataView(APIView):
    """
    POST /api/company/reset-data/
    Deletes all the company's offers and related internships.
    Requires the company's password for confirmation.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT})
    def post(self, request):
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response(
                {'detail': 'Invalid password.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        company = get_company(request)
        deleted_offers = InternshipOffer.objects.filter(
            company=company,
        ).delete()
        deleted_internships = Internship.objects.filter(
            company=company,
        ).delete()

        return Response(
            {
                'detail': 'All company data has been reset.',
                'deleted_offers': deleted_offers[0],
                'deleted_internships': deleted_internships[0],
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Company Applicants'])
class DownloadAgreementView(APIView):
    """
    GET /api/company/applications/<id>/document/
    Download the internship agreement PDF.
    Only available when status = VALIDATED and a PDF has been generated.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCompany]

    @extend_schema(responses={200: OpenApiTypes.BINARY, 403: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT})
    def get(self, request, pk):
        company = get_company(request)

        try:
            application = Internship.objects.select_related(
                'agreement',
            ).get(pk=pk, company=company)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Must be validated
        if application.status != Internship.Status.VALIDATED:
            return Response(
                {'detail': 'Agreement is not available yet. The internship must be validated first.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Must have a PDF
        if not hasattr(application, 'agreement') or not application.agreement.pdf_file:
            return Response(
                {'detail': 'Agreement PDF has not been generated yet.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        application.agreement.pdf_file.open('rb')
        return FileResponse(
            application.agreement.pdf_file,
            as_attachment=True,
            filename=f'internship_agreement_{application.id}.pdf',
            content_type='application/pdf',
        )