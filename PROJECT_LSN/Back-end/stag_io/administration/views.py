"""Views for the administration API."""
from datetime import timedelta

from django.http import FileResponse
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth, TruncWeek
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes

from core.models import Admin, Internship, Notification
from administration.serializers import (
    AdminInternshipDetailSerializer,
    AdminInternshipSerializer,
    NotificationSerializer,
)
from administration.permissions import IsAdminUser, IsAdminOfSameUniversity
from administration.services import generate_internship_agreement


def _get_admin(request):
    """Return the authenticated admin object."""
    return Admin.objects.get(pk=request.user.pk)


def _get_university_internships(request):
    """Return internships for the authenticated admin's university."""
    admin = _get_admin(request)
    return Internship.objects.filter(
        student__university=admin.university,
    )


# ── Notification views ──────────────────────────────────────────────

@extend_schema(tags=['Administration - Notifications'])
class NotificationListView(generics.ListAPIView):
    """List all notifications for the authenticated admin (same university only)."""
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        admin = _get_admin(self.request)
        return Notification.objects.filter(
            recipient__pk=self.request.user.pk,
            internship__student__university=admin.university,
        ).select_related(
            'internship', 'internship__student', 'internship__company',
        )


@extend_schema(tags=['Administration - Notifications'])
class UnreadNotificationListView(generics.ListAPIView):
    """List unread notifications for the authenticated admin (same university only)."""
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        admin = _get_admin(self.request)
        return Notification.objects.filter(
            recipient__pk=self.request.user.pk,
            is_read=False,
            internship__student__university=admin.university,
        ).select_related(
            'internship', 'internship__student', 'internship__company',
        )


@extend_schema(tags=['Administration - Notifications'])
class MarkNotificationReadView(APIView):
    """Mark a single notification as read."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(request=None, responses={200: NotificationSerializer, 404: OpenApiTypes.OBJECT})
    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(
                pk=pk, recipient__pk=request.user.pk,
            )
        except Notification.DoesNotExist:
            return Response(
                {'detail': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ── Internship views ────────────────────────────────────────────────


@extend_schema(tags=['Administration'])
class AllInternshipListView(generics.ListAPIView):
    """List all internships for admin's university."""
    serializer_class = AdminInternshipSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        admin = Admin.objects.get(pk=self.request.user.pk)
        return Internship.objects.filter(
            student__university=admin.university,
        ).select_related('student', 'company')


@extend_schema(tags=['Administration'])
class InternshipDetailView(generics.RetrieveAPIView):
    """Retrieve a single internship detail."""
    serializer_class = AdminInternshipDetailSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser, IsAdminOfSameUniversity]

    def get_queryset(self):
        return Internship.objects.select_related(
            'student', 'student__university', 'company', 'agreement',
        ).prefetch_related(
            'student__student_skills__skill',
        )


@extend_schema(tags=['Administration'])
class DownloadInternshipAgreementView(APIView):
    """Download the generated internship agreement PDF."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser, IsAdminOfSameUniversity]

    @extend_schema(responses={200: OpenApiTypes.BINARY, 404: OpenApiTypes.OBJECT})
    def get(self, request, pk):
        try:
            internship = Internship.objects.select_related(
                'student', 'student__university', 'company', 'agreement',
            ).get(pk=pk)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Internship not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        admin = Admin.objects.get(pk=request.user.pk)
        if internship.student.university != admin.university:
            return Response(
                {'detail': 'Not allowed.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not hasattr(internship, 'agreement') or not internship.agreement.pdf_file:
            return Response(
                {'detail': 'Agreement not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        internship.agreement.pdf_file.open('rb')
        return FileResponse(
            internship.agreement.pdf_file,
            as_attachment=True,
            filename=f'internship_agreement_{internship.id}.pdf',
            content_type='application/pdf',
        )


@extend_schema(tags=['Administration'])
class ValidateInternshipView(APIView):
    """Validate an internship (set status to 'validated')."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser, IsAdminOfSameUniversity]

    @extend_schema(request=None, responses={200: AdminInternshipSerializer, 400: OpenApiTypes.OBJECT})
    def patch(self, request, pk):
        try:
            internship = Internship.objects.select_related(
                'student', 'company',
            ).get(pk=pk)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Internship not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check university scope
        admin = Admin.objects.get(pk=request.user.pk)
        if internship.student.university != admin.university:
            return Response(
                {'detail': 'Not allowed.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if internship.status != Internship.Status.ACCEPTED_BY_COMPANY:
            return Response(
                {'detail': 'Only internships accepted by a company can be validated.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        internship.status = Internship.Status.VALIDATED
        internship.save()

        try:
            generate_internship_agreement(internship, admin=admin)
        except ValueError as error:
            internship.status = Internship.Status.ACCEPTED_BY_COMPANY
            internship.save(update_fields=['status'])
            return Response(
                {'detail': str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        
        # Notify student and company that internship is validated
        from core.notifications import (
            notify_student_validated,
            notify_company_agreement_ready,
        )
        notify_student_validated(internship)
        notify_company_agreement_ready(internship)

        # Mark related notifications as read
        Notification.objects.filter(
            internship=internship,
            recipient__pk=request.user.pk,
        ).update(is_read=True)

        serializer = AdminInternshipSerializer(internship)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Administration'])
class RejectInternshipView(APIView):
    """Reject an internship (set status to 'rejected')."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser, IsAdminOfSameUniversity]

    @extend_schema(request=None, responses={200: AdminInternshipSerializer, 400: OpenApiTypes.OBJECT})
    def patch(self, request, pk):
        try:
            internship = Internship.objects.select_related(
                'student', 'company',
            ).get(pk=pk)
        except Internship.DoesNotExist:
            return Response(
                {'detail': 'Internship not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check university scope
        admin = Admin.objects.get(pk=request.user.pk)
        if internship.student.university != admin.university:
            return Response(
                {'detail': 'Not allowed.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if internship.status not in [
            Internship.Status.PENDING,
            Internship.Status.ACCEPTED_BY_COMPANY,
        ]:
            return Response(
                {'detail': 'This internship cannot be rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejection_reason = request.data.get('rejection_reason', '')
        internship.rejection_reason = rejection_reason
        internship.status = Internship.Status.REJECTED
        internship.save()

        # Notify company that admin rejected the internship
        from core.notifications import notify_company_admin_rejected
        notify_company_admin_rejected(internship)

        # Mark related notifications as read
        Notification.objects.filter(
            internship=internship,
            recipient__pk=request.user.pk,
        ).update(is_read=True)

        serializer = AdminInternshipSerializer(internship)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ── Statistics views ───────────────────────────────────────────────


@extend_schema(tags=['Administration - Statistics'])
class StatisticsSummaryView(APIView):
    """Main dashboard summary for admin's university."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        admin = _get_admin(request)
        students_qs = admin.university.students.all()
        internships_qs = _get_university_internships(request)

        total_students = students_qs.count()
        placed_students = students_qs.filter(
            internships__status__in=[
                Internship.Status.ACCEPTED_BY_COMPANY,
                Internship.Status.VALIDATED,
            ],
        ).distinct().count()
        unplaced_students = total_students - placed_students
        placement_rate = round(
            (placed_students / total_students) * 100, 2,
        ) if total_students else 0.0

        status_counts = internships_qs.aggregate(
            pending=Count('id', filter=Q(status=Internship.Status.PENDING)),
            accepted_by_company=Count(
                'id',
                filter=Q(status=Internship.Status.ACCEPTED_BY_COMPANY),
            ),
            validated=Count('id', filter=Q(status=Internship.Status.VALIDATED)),
            rejected=Count('id', filter=Q(status=Internship.Status.REJECTED)),
            total=Count('id'),
        )

        return Response({
            'university': admin.university.name if admin.university else None,
            'students': {
                'total': total_students,
                'placed': placed_students,
                'unplaced': unplaced_students,
                'placement_rate': placement_rate,
            },
            'internships': status_counts,
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Administration - Statistics'])
class StatisticsCompaniesView(APIView):
    """Company-level internship outcomes for admin's university."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        rows = _get_university_internships(request).values(
            'company_id', 'company__name',
        ).annotate(
            total_internships=Count('id'),
            pending=Count('id', filter=Q(status=Internship.Status.PENDING)),
            accepted_by_company=Count(
                'id', filter=Q(status=Internship.Status.ACCEPTED_BY_COMPANY),
            ),
            validated=Count('id', filter=Q(status=Internship.Status.VALIDATED)),
            rejected=Count('id', filter=Q(status=Internship.Status.REJECTED)),
        ).order_by('-validated', '-accepted_by_company', 'company__name')

        data = [
            {
                'company_id': row['company_id'],
                'company_name': row['company__name'],
                'total_internships': row['total_internships'],
                'pending': row['pending'],
                'accepted_by_company': row['accepted_by_company'],
                'validated': row['validated'],
                'rejected': row['rejected'],
            }
            for row in rows
        ]

        return Response({'companies': data}, status=status.HTTP_200_OK)


@extend_schema(tags=['Administration - Statistics'])
class StatisticsWilayasView(APIView):
    """Geographic distribution grouped by student or company wilaya."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        source = request.query_params.get('source', 'student')
        internships_qs = _get_university_internships(request)

        if source == 'company':
            wilaya_field = 'company__wilaya'
        else:
            source = 'student'
            wilaya_field = 'student__wilaya'

        rows = internships_qs.values(wilaya_field).annotate(
            internships_count=Count('id'),
        ).order_by('-internships_count', wilaya_field)

        data = [
            {
                'wilaya': row[wilaya_field] or 'Unknown',
                'internships_count': row['internships_count'],
            }
            for row in rows
        ]

        return Response(
            {'source': source, 'distribution': data},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Administration - Statistics'])
class StatisticsTrendsView(APIView):
    """Monthly or weekly internship trend aggregation."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        period = request.query_params.get('period', 'monthly')
        internships_qs = _get_university_internships(request)

        if period == 'weekly':
            bucket_expr = TruncWeek('updated_at')
            period = 'weekly'
        else:
            bucket_expr = TruncMonth('updated_at')
            period = 'monthly'

        rows = internships_qs.annotate(
            bucket=bucket_expr,
        ).values('bucket').annotate(
            placements=Count(
                'id',
                filter=Q(
                    status__in=[
                        Internship.Status.ACCEPTED_BY_COMPANY,
                        Internship.Status.VALIDATED,
                    ],
                ),
            ),
            validations=Count(
                'id', filter=Q(status=Internship.Status.VALIDATED),
            ),
            total_updates=Count('id'),
        ).order_by('bucket')

        trends = [
            {
                'period_start': row['bucket'].date().isoformat() if row['bucket'] else None,
                'placements': row['placements'],
                'validations': row['validations'],
                'total_updates': row['total_updates'],
            }
            for row in rows
        ]

        return Response(
            {'period': period, 'trends': trends},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Administration - Statistics'])
class StatisticsAgreementsView(APIView):
    """Agreement generation coverage for university internships."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        internships_qs = _get_university_internships(request)
        totals = internships_qs.aggregate(
            total_internships=Count('id'),
            agreements_generated=Count('id', filter=Q(agreement__isnull=False)),
        )

        total = totals['total_internships']
        generated = totals['agreements_generated']
        missing = total - generated

        return Response(
            {
                'total_internships': total,
                'agreements_generated': generated,
                'agreements_missing': missing,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Administration - Statistics'])
class StatisticsStatusesView(APIView):
    """Focused internship status analytics for the university."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        statuses = _get_university_internships(request).aggregate(
            pending=Count('id', filter=Q(status=Internship.Status.PENDING)),
            accepted_by_company=Count(
                'id', filter=Q(status=Internship.Status.ACCEPTED_BY_COMPANY),
            ),
            validated=Count('id', filter=Q(status=Internship.Status.VALIDATED)),
            rejected=Count('id', filter=Q(status=Internship.Status.REJECTED)),
            total=Count('id'),
        )
        return Response(statuses, status=status.HTTP_200_OK)


@extend_schema(tags=['Administration - Statistics'])
class StatisticsStudentsView(APIView):
    """Student participation metrics for the admin's university."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        admin = _get_admin(request)
        students_qs = admin.university.students.all()

        total_students = students_qs.count()
        students_with_internships = students_qs.filter(
            internships__status__in=[
                Internship.Status.ACCEPTED_BY_COMPANY,
                Internship.Status.VALIDATED,
            ],
        ).distinct().count()

        return Response(
            {
                'total_students': total_students,
                'students_with_internships': students_with_internships,
                'students_without_internships': (
                    total_students - students_with_internships
                ),
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Administration - Statistics'])
class StatisticsCompanyDetailView(APIView):
    """Detailed analytics for one company within admin's university scope."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request, company_id):
        internships_qs = _get_university_internships(request)
        company_qs = internships_qs.filter(company_id=company_id)

        if not company_qs.exists():
            return Response(
                {'detail': 'Company not found for this university scope.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        company_name = company_qs.values_list(
            'company__name', flat=True,
        ).first()
        stats = company_qs.aggregate(
            total_internships=Count('id'),
            pending=Count('id', filter=Q(status=Internship.Status.PENDING)),
            accepted_by_company=Count(
                'id', filter=Q(status=Internship.Status.ACCEPTED_BY_COMPANY),
            ),
            validated=Count('id', filter=Q(status=Internship.Status.VALIDATED)),
            rejected=Count('id', filter=Q(status=Internship.Status.REJECTED)),
        )

        university_placements = internships_qs.filter(
            status__in=[
                Internship.Status.ACCEPTED_BY_COMPANY,
                Internship.Status.VALIDATED,
            ],
        ).count()
        company_placements = company_qs.filter(
            status__in=[
                Internship.Status.ACCEPTED_BY_COMPANY,
                Internship.Status.VALIDATED,
            ],
        ).count()
        share = round(
            (company_placements / university_placements) * 100, 2,
        ) if university_placements else 0.0

        stats.update({
            'company_id': company_id,
            'company_name': company_name,
            'company_placements': company_placements,
            'university_placements': university_placements,
            'placement_share_percent': share,
        })

        return Response(stats, status=status.HTTP_200_OK)


# ── Mark all admin notifications as read ─────────────────────────────

@extend_schema(tags=['Administration - Notifications'])
class MarkAllAdminNotificationsReadView(APIView):
    """
    PATCH /api/administration/notifications/mark-all-read/
    Mark ALL notifications for the admin as read.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

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


# ── Admin reset data ────────────────────────────────────────────────

@extend_schema(tags=['Administration'])
class AdminResetDataView(APIView):
    """
    POST /api/administration/reset-data/
    Resets all internship data scoped to the admin's university.
    Requires the admin's password for confirmation.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT})
    def post(self, request):
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response(
                {'detail': 'Invalid password.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        admin = _get_admin(request)
        deleted = Internship.objects.filter(
            student__university=admin.university,
        ).delete()

        return Response(
            {
                'detail': 'All internship data for your university has been reset.',
                'deleted_internships': deleted[0],
            },
            status=status.HTTP_200_OK,
        )


# ── Public endpoints (no authentication) ─────────────────────────────

@extend_schema(tags=['Public'])
class PublicCompanyListView(generics.ListAPIView):
    """
    GET /api/administration/public/companies/
    Public list of all companies. No authentication required.
    """
    from company.serializers import InternshipOfferSerializer

    def get_queryset(self):
        from core.models import Company
        return Company.objects.all()

    def list(self, request, *args, **kwargs):
        from core.models import Company
        companies = Company.objects.all()
        data = [
            {
                'id': c.pk,
                'name': c.name,
                'description': c.description,
                'logo': c.logo.url if c.logo else None,
                'wilaya': c.wilaya,
                'website': c.website,
            }
            for c in companies
        ]
        return Response(data, status=status.HTTP_200_OK)


@extend_schema(tags=['Public'])
class PublicOfferListView(generics.ListAPIView):
    """
    GET /api/administration/public/offers/
    Public list of all active (open) offers. No authentication required.
    """
    from company.serializers import InternshipOfferSerializer
    serializer_class = InternshipOfferSerializer

    def get_queryset(self):
        from core.models import InternshipOffer
        return InternshipOffer.objects.filter(
            status=InternshipOffer.Status.OPEN,
        ).select_related('company').prefetch_related(
            'offer_skills__skill',
        ).order_by('-created_at')
