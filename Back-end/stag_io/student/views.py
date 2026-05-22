"""Views for the student app — skills, offer search, applications, and Digital CV."""
from django.http import FileResponse
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from core.models import Student, InternshipOffer, Internship, InternshipAgreement
from student.models import Skill, StudentSkill
from student.serializers import (
    SkillSerializer,
    StudentSkillSerializer,
    AddStudentSkillSerializer,
    StudentOfferListSerializer,
    StudentOfferDetailSerializer,
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    StudentDocumentListSerializer,
    DigitalCVSerializer,
    DigitalCVUpdateSerializer,
)
from user.views import IsStudent


def get_student(request):
    """Get the Student object for the currently logged-in user."""
    return Student.objects.get(pk=request.user.pk)


# ── Skill views ──────────────────────────────────────────────────────

@extend_schema(tags=['Skills'])
class SkillListView(generics.ListAPIView):
    """
    GET /api/student/skills/
    Returns all available skills as a flat list.
    Used to populate the chips selector on the profile page.
    """
    serializer_class = SkillSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Skill.objects.all()


@extend_schema(tags=['Skills'])
class MySkillListView(generics.ListAPIView):
    """
    GET /api/student/me/skills/
    Returns the skills the logged-in student has selected.
    """
    serializer_class = StudentSkillSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    def get_queryset(self):
        student = get_student(self.request)
        return StudentSkill.objects.filter(
            student=student,
        ).select_related('skill')


@extend_schema(
    tags=['Skills'],
    request=AddStudentSkillSerializer,
    responses={201: StudentSkillSerializer},
)
class AddSkillView(APIView):
    """
    POST /api/student/me/skills/add/
    Student adds a skill chip to their profile.
    Request body: { "skill_id": 3 }
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = AddStudentSkillSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        skill_id = serializer.validated_data['skill_id']
        student = get_student(request)
        skill = Skill.objects.get(id=skill_id)

        if StudentSkill.objects.filter(student=student, skill=skill).exists():
            return Response(
                {'detail': 'You already have this skill.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        student_skill = StudentSkill.objects.create(
            student=student, skill=skill,
        )
        return Response(
            StudentSkillSerializer(student_skill).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Skills'])
class RemoveSkillView(APIView):
    """
    DELETE /api/student/me/skills/<id>/remove/
    Student removes a skill chip by clicking X.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    @extend_schema(responses={204: None})
    def delete(self, request, pk):
        student = get_student(request)
        try:
            student_skill = StudentSkill.objects.get(pk=pk, student=student)
        except StudentSkill.DoesNotExist:
            return Response(
                {'detail': 'Skill not found on your profile.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        student_skill.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Offer search views ───────────────────────────────────────────────

@extend_schema(
    tags=['Student - Offers'],
    parameters=[
        OpenApiParameter('search', OpenApiTypes.STR, description='Search in title and description'),
        OpenApiParameter('wilaya', OpenApiTypes.STR, description='Filter by wilaya e.g. 19 - Sétif'),
        OpenApiParameter('skills', OpenApiTypes.STR, description='Comma-separated skill IDs e.g. 1,3,5'),
        OpenApiParameter('type', OpenApiTypes.STR, description='paid or unpaid'),
        OpenApiParameter('duration', OpenApiTypes.STR, description='short (14-28 days), medium (29-60 days), long (60+ days)'),
        OpenApiParameter('ordering', OpenApiTypes.STR, description='recent (default), salary_high, start_soon'),
        OpenApiParameter('remote', OpenApiTypes.STR, description='true to show only remote internships'),
    ],
)
class StudentOfferListView(generics.ListAPIView):
    """
    GET /api/student/offers/
    Browse and search all open internship offers.

    Filters:
    - search      → matches title or description
    - wilaya      → exact wilaya string e.g. '19 - Sétif'
    - skills      → comma-separated skill IDs e.g. '1,3,5'
    - type        → 'paid' or 'unpaid'
    - duration    → 'short' (2-4 weeks), 'medium' (1-2 months), 'long' (2+ months)

    Ordering:
    - recent      → newest first (default)
    - salary_high → highest salary first (paid offers only)
    - start_soon  → earliest start date first
    """
    serializer_class = StudentOfferListSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    def get_queryset(self):
        # Start with only open offers
        queryset = InternshipOffer.objects.filter(
            status=InternshipOffer.Status.OPEN,
        ).prefetch_related('offer_skills__skill').select_related('company')

        params = self.request.query_params

        # ── Search bar ──────────────────────────────────────────────
        search = params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # ── Wilaya filter ───────────────────────────────────────────
        wilaya = params.get('wilaya')
        if wilaya:
            queryset = queryset.filter(wilaya=wilaya)

        # ── Remote filter ───────────────────────────────────────────
        remote = params.get('remote', '').lower()
        if remote == 'true':
            queryset = queryset.filter(is_remote=True)

        # ── Skills filter (chips) ───────────────────────────────────
        # Accepts comma-separated IDs: ?skills=1,3,5
        # Returns offers that have ALL of the selected skills
        skills_param = params.get('skills')
        if skills_param:
            skill_ids = [
                s.strip() for s in skills_param.split(',') if s.strip().isdigit()
            ]
            for skill_id in skill_ids:
                queryset = queryset.filter(offer_skills__skill_id=skill_id)

        # ── Type filter ─────────────────────────────────────────────
        offer_type = params.get('type')
        if offer_type in ['paid', 'unpaid']:
            queryset = queryset.filter(type=offer_type)

        # ── Duration filter ─────────────────────────────────────────
        duration = params.get('duration')
        if duration == 'short':
            # 2 to 4 weeks (14 to 28 days)
            from django.db.models import ExpressionWrapper, F, DurationField
            from datetime import timedelta
            queryset = queryset.annotate(
                day_count=ExpressionWrapper(
                    F('end_date') - F('start_date'),
                    output_field=DurationField(),
                )
            ).filter(
                day_count__gte=timedelta(days=14),
                day_count__lte=timedelta(days=28),
            )
        elif duration == 'medium':
            # 1 to 2 months (29 to 60 days)
            from django.db.models import ExpressionWrapper, F, DurationField
            from datetime import timedelta
            queryset = queryset.annotate(
                day_count=ExpressionWrapper(
                    F('end_date') - F('start_date'),
                    output_field=DurationField(),
                )
            ).filter(
                day_count__gte=timedelta(days=29),
                day_count__lte=timedelta(days=60),
            )
        elif duration == 'long':
            # More than 2 months (60+ days)
            from django.db.models import ExpressionWrapper, F, DurationField
            from datetime import timedelta
            queryset = queryset.annotate(
                day_count=ExpressionWrapper(
                    F('end_date') - F('start_date'),
                    output_field=DurationField(),
                )
            ).filter(day_count__gt=timedelta(days=60))

        # ── Ordering ────────────────────────────────────────────────
        ordering = params.get('ordering', 'recent')
        if ordering == 'salary_high':
            queryset = queryset.order_by('-salary_per_week')
        elif ordering == 'start_soon':
            queryset = queryset.order_by('start_date')
        else:
            # Default: most recently posted first
            queryset = queryset.order_by('-created_at')

        return queryset.distinct()


@extend_schema(tags=['Student - Offers'])
class StudentOfferDetailView(APIView):
    """
    GET /api/student/offers/<id>/
    View full details of a specific offer.
    Also tells the frontend if this student already applied
    via the 'already_applied' field.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    @extend_schema(responses={200: StudentOfferDetailSerializer})
    def get(self, request, pk):
        try:
            offer = InternshipOffer.objects.prefetch_related(
                'offer_skills__skill',
            ).select_related('company').get(
                pk=pk, status=InternshipOffer.Status.OPEN,
            )
        except InternshipOffer.DoesNotExist:
            return Response(
                {'detail': 'Offer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = StudentOfferDetailSerializer(
            offer, context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


# ── Application views ────────────────────────────────────────────────

@extend_schema(tags=['Student - Applications'])
class ApplyToOfferView(APIView):
    """
    POST /api/student/offers/<id>/apply/
    Student applies to an internship offer.

    Creates an Internship (application) record with status=PENDING.
    The offer's start_date, end_date, title are copied automatically.
    A student cannot apply twice to the same offer.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    @extend_schema(request=None, responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT})
    def post(self, request, pk):
        # 1. Get the offer
        try:
            offer = InternshipOffer.objects.select_related('company').get(
                pk=pk, status=InternshipOffer.Status.OPEN,
            )
        except InternshipOffer.DoesNotExist:
            return Response(
                {'detail': 'Offer not found or no longer open.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        student = get_student(request)

        # 2. Check if already applied
        if Internship.objects.filter(student=student, offer=offer).exists():
            return Response(
                {'detail': 'You have already applied to this offer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Create the application
        # We copy subject/dates from the offer so the admin
        # and company see consistent data
        application = Internship.objects.create(
            student=student,
            company=offer.company,
            offer=offer,
            subject=offer.title,
            description=offer.description,
            start_date=offer.start_date,
            end_date=offer.end_date,
            status=Internship.Status.PENDING,
        )

        # Notify student their application was submitted
        from core.notifications import (
            notify_student_application_submitted,
            notify_company_new_applicant,
        )
        notify_student_application_submitted(application)
        notify_company_new_applicant(application)

        return Response(
            {
                'detail': 'Application submitted successfully.',
                'application_id': application.id,
                'status': application.status,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Student - Applications'])
class MyApplicationListView(generics.ListAPIView):
    """
    GET /api/student/applications/
    List all of the logged-in student's applications with their statuses.
    Ordered by most recent first.
    """
    serializer_class = ApplicationListSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    def get_queryset(self):
        student = get_student(self.request)
        return Internship.objects.filter(
            student=student,
        ).select_related('offer', 'company').order_by('-created_at')


@extend_schema(tags=['Student - Applications'])
class MyApplicationDetailView(APIView):
    """
    GET /api/student/applications/<id>/
    View full details of one specific application.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    @extend_schema(responses={200: ApplicationDetailSerializer})
    def get(self, request, pk):
        student = get_student(request)
        try:
            application = Internship.objects.select_related(
                'offer', 'company',
            ).prefetch_related(
                'offer__offer_skills__skill',
            ).get(pk=pk, student=student)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ApplicationDetailSerializer(
            application, context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Student - Applications'])
class DownloadAgreementView(APIView):
    """
    GET /api/student/applications/<id>/document/
    Download the internship agreement PDF.
    Only available when status = VALIDATED and a PDF has been generated.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    @extend_schema(responses={200: OpenApiTypes.BINARY, 403: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT})
    def get(self, request, pk):
        student = get_student(request)

        try:
            application = Internship.objects.select_related(
                'agreement',
            ).get(pk=pk, student=student)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Must be validated
        if application.status != Internship.Status.VALIDATED:
            return Response(
                {'detail': 'Agreement is not available yet. Your internship must be validated first.'},
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


@extend_schema(tags=['Student - Applications'])
class MyDocumentListView(generics.ListAPIView):
    """
    GET /api/student/documents/
    List all generated internship agreements (documents) for the logged-in student.
    """
    serializer_class = StudentDocumentListSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    def get_queryset(self):
        student = get_student(self.request)
        return InternshipAgreement.objects.filter(
            internship__student=student,
        ).select_related('internship__offer', 'internship__company').order_by('-generated_at')


# ── Digital CV views ─────────────────────────────────────────────────

@extend_schema(tags=['Student - Digital CV'])
class DigitalCVView(APIView):
    """
    GET  /api/student/me/cv/ — View own Digital CV
    PATCH /api/student/me/cv/ — Update Digital CV fields

    The Digital CV aggregates:
    - Personal info from profile (read-only here: name, email, wilaya, DOB, photo)
    - University (auto-assigned at registration, read-only)
    - Academic info (academic year)
    - Professional info (summary, github, portfolio)
    - Skills (managed via separate add/remove endpoints)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStudent]

    @extend_schema(responses={200: DigitalCVSerializer})
    def get(self, request):
        student = get_student(request)
        serializer = DigitalCVSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=DigitalCVUpdateSerializer,
        responses={200: DigitalCVSerializer},
    )
    def patch(self, request):
        student = get_student(request)
        serializer = DigitalCVUpdateSerializer(
            student, data=request.data, partial=True,
        )
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        # Return the full CV representation
        return Response(
            DigitalCVSerializer(student).data,
            status=status.HTTP_200_OK,
        )