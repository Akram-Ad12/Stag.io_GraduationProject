"""Tests for the administration API."""
from datetime import date
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    InternshipAgreement,
    University,
    Student,
    Company,
    Admin,
    Internship,
    Notification,
)


INTERNSHIP_LIST_URL = reverse('administration:internship-list')
NOTIFICATION_LIST_URL = reverse('administration:notification-list')
NOTIFICATION_UNREAD_URL = reverse('administration:notification-unread')
STATISTICS_SUMMARY_URL = reverse('administration:statistics-summary')
STATISTICS_COMPANIES_URL = reverse('administration:statistics-companies')
STATISTICS_WILAYAS_URL = reverse('administration:statistics-wilayas')
STATISTICS_TRENDS_URL = reverse('administration:statistics-trends')
STATISTICS_AGREEMENTS_URL = reverse('administration:statistics-agreements')
STATISTICS_STATUSES_URL = reverse('administration:statistics-statuses')
STATISTICS_STUDENTS_URL = reverse('administration:statistics-students')


def internship_detail_url(internship_id):
    return reverse('administration:internship-detail', args=[internship_id])


def internship_validate_url(internship_id):
    return reverse('administration:internship-validate', args=[internship_id])


def internship_reject_url(internship_id):
    return reverse('administration:internship-reject', args=[internship_id])


def internship_agreement_download_url(internship_id):
    return reverse('administration:internship-agreement-download', args=[internship_id])


def notification_read_url(notification_id):
    return reverse('administration:notification-read', args=[notification_id])


def statistics_company_detail_url(company_id):
    return reverse('administration:statistics-company-detail', args=[company_id])


def create_university(**params):
    defaults = {
        'name': 'University of Test',
        'code': 'UOT',
        'wilaya': 'Algiers',
    }
    defaults.update(params)
    return University.objects.create(**defaults)


def create_student(university, **params):
    defaults = {
        'email': 'student@example.com',
        'password': 'testpass123',
        'full_name': 'Test Student',
        'wilaya': 'Algiers',
    }
    defaults.update(params)
    pw = defaults.pop('password')
    student = Student(university=university, role='student', **defaults)
    student.set_password(pw)
    student.save()
    return student


def create_company(**params):
    defaults = {
        'email': 'company@example.com',
        'password': 'testpass123',
        'name': 'Test Company',
        'wilaya': 'Algiers',
    }
    defaults.update(params)
    company = Company.objects.create_user(**defaults)
    company.role = 'company'
    company.save()
    return company


def create_admin_user(university, **params):
    defaults = {
        'email': 'admin@example.com',
        'password': 'testpass123',
        'department': 'CS',
        'title': 'Head of Department',
    }
    defaults.update(params)
    pw = defaults.pop('password')
    admin = Admin(university=university, role='admin', **defaults)
    admin.set_password(pw)
    admin.save()
    return admin


def create_internship(student, company, **params):
    defaults = {
        'subject': 'Django Development',
        'description': 'Building APIs',
        'start_date': date(2026, 4, 1),
        'end_date': date(2026, 6, 30),
        'status': Internship.Status.ACCEPTED_BY_COMPANY,
    }
    defaults.update(params)
    return Internship.objects.create(
        student=student, company=company, **defaults,
    )


def create_notification(recipient, internship, **params):
    defaults = {
        'notification_type': Notification.Type.INTERNSHIP_ACCEPTED,
        'message': f'{internship.company.name} accepted {internship.student.full_name}',
    }
    defaults.update(params)
    return Notification.objects.create(
        recipient=recipient, internship=internship, **defaults,
    )


def create_internship_agreement(internship, file_name='agreement.pdf'):
    agreement = InternshipAgreement.objects.create(internship=internship)
    agreement.pdf_file.save(
        file_name,
        ContentFile(b'%PDF-1.4 test agreement'),
        save=True,
    )
    return agreement


class PublicAdministrationApiTests(TestCase):
    """Test unauthenticated access is denied."""

    def setUp(self):
        self.client = APIClient()

    def test_internship_list_requires_auth(self):
        res = self.client.get(INTERNSHIP_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class NonAdminAccessTests(TestCase):
    """Test that non-admin users cannot access admin endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_student_cannot_list_internships(self):
        res = self.client.get(INTERNSHIP_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class AdminInternshipListTests(TestCase):
    """Test admin internship list endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.other_university = create_university(
            name='Other University', code='OTH',
        )
        self.admin_user = create_admin_user(self.university)
        self.student = create_student(self.university)
        self.company = create_company()
        self.client.force_authenticate(user=self.admin_user)

    def test_list_all_internships_for_university(self):
        """Admin sees only internships for their university's students."""
        create_internship(self.student, self.company)

        # Student from other university
        other_student = create_student(
            self.other_university,
            email='other@example.com',
            full_name='Other Student',
        )
        create_internship(other_student, self.company)

        res = self.client.get(INTERNSHIP_LIST_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(
            res.data[0]['student_name'], self.student.full_name,
        )


class AdminValidateRejectTests(TestCase):
    """Test validate and reject endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.admin_user = create_admin_user(self.university)
        self.student = create_student(self.university)
        self.company = create_company()
        self.client.force_authenticate(user=self.admin_user)

    @patch('administration.views.generate_internship_agreement')
    def test_validate_internship(self, mock_generate_agreement):
        internship = create_internship(self.student, self.company)

        res = self.client.patch(internship_validate_url(internship.id))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        internship.refresh_from_db()
        self.assertEqual(internship.status, Internship.Status.VALIDATED)
        mock_generate_agreement.assert_called_once_with(
            internship, admin=self.admin_user,
        )

    @patch(
        'administration.views.generate_internship_agreement',
        side_effect=ValueError('No administrator found for this university.'),
    )
    def test_validate_internship_rolls_back_when_agreement_generation_fails(
        self, mock_generate_agreement,
    ):
        internship = create_internship(self.student, self.company)

        res = self.client.patch(internship_validate_url(internship.id))

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data['detail'],
            'No administrator found for this university.',
        )
        internship.refresh_from_db()
        self.assertEqual(
            internship.status,
            Internship.Status.ACCEPTED_BY_COMPANY,
        )
        mock_generate_agreement.assert_called_once_with(
            internship, admin=self.admin_user,
        )

    def test_reject_internship(self):
        internship = create_internship(self.student, self.company)

        res = self.client.patch(internship_reject_url(internship.id))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        internship.refresh_from_db()
        self.assertEqual(internship.status, Internship.Status.REJECTED)

    def test_cannot_validate_pending_internship(self):
        """Can only validate if status is accepted_by_company."""
        internship = create_internship(
            self.student, self.company,
            status=Internship.Status.PENDING,
        )

        res = self.client.patch(internship_validate_url(internship.id))

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_reject_already_validated(self):
        internship = create_internship(
            self.student, self.company,
            status=Internship.Status.VALIDATED,
        )

        res = self.client.patch(internship_reject_url(internship.id))

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_validate_other_university_internship(self):
        """Admin from university A cannot validate university B's internship."""
        other_uni = create_university(name='Other Uni', code='OTH')
        other_student = create_student(
            other_uni,
            email='otherstudent@example.com',
            full_name='Other Student',
        )
        internship = create_internship(other_student, self.company)

        res = self.client.patch(internship_validate_url(internship.id))

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class PublicNotificationApiTests(TestCase):
    """Test unauthenticated access to notification endpoints is denied."""

    def setUp(self):
        self.client = APIClient()

    def test_notification_list_requires_auth(self):
        res = self.client.get(NOTIFICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unread_notifications_requires_auth(self):
        res = self.client.get(NOTIFICATION_UNREAD_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class NonAdminNotificationAccessTests(TestCase):
    """Test that non-admin users cannot access notification endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_student_cannot_list_notifications(self):
        res = self.client.get(NOTIFICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_list_unread_notifications(self):
        res = self.client.get(NOTIFICATION_UNREAD_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class AdminNotificationTests(TestCase):
    """Test admin notification endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.admin_user = create_admin_user(self.university)
        self.student = create_student(self.university)
        self.company = create_company()
        self.client.force_authenticate(user=self.admin_user)

    def test_list_notifications(self):
        """Admin sees their own notifications."""
        from core.models import InternshipOffer
        offer = InternshipOffer.objects.create(
            company=self.company,
            title='Software Engineer',
            description='Django coding',
            location='Algiers',
            start_date=date(2026, 4, 1),
            end_date=date(2026, 6, 30),
        )
        internship = create_internship(self.student, self.company, offer=offer)
        create_notification(self.admin_user, internship)

        res = self.client.get(NOTIFICATION_LIST_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['student_name'], self.student.full_name)
        self.assertEqual(res.data[0]['company_name'], self.company.name)
        self.assertEqual(res.data[0]['offer_id'], offer.id)

    def test_list_unread_notifications(self):
        """Only unread notifications are returned."""
        internship = create_internship(self.student, self.company)
        create_notification(self.admin_user, internship)
        create_notification(
            self.admin_user, internship, is_read=True,
        )

        res = self.client.get(NOTIFICATION_UNREAD_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertFalse(res.data[0]['is_read'])

    def test_mark_notification_as_read(self):
        """PATCH marks a notification as read."""
        internship = create_internship(self.student, self.company)
        notification = create_notification(self.admin_user, internship)

        res = self.client.patch(notification_read_url(notification.id))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_cannot_read_other_admin_notification(self):
        """Admin cannot mark another admin's notification as read."""
        other_uni = create_university(name='Other Uni', code='OTH')
        other_admin = create_admin_user(
            other_uni, email='other_admin@example.com',
        )
        internship = create_internship(self.student, self.company)
        notification = create_notification(other_admin, internship)

        res = self.client.patch(notification_read_url(notification.id))

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_only_sees_own_notifications(self):
        """Admin does not see notifications for other admins."""
        other_uni = create_university(name='Other Uni', code='OTH')
        other_admin = create_admin_user(
            other_uni, email='other_admin@example.com',
        )
        internship = create_internship(self.student, self.company)
        create_notification(other_admin, internship)

        res = self.client.get(NOTIFICATION_LIST_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    @patch('administration.views.generate_internship_agreement')
    def test_validate_marks_notification_as_read(self, mock_generate_agreement):
        """Validating an internship auto-marks related notifications as read."""
        internship = create_internship(self.student, self.company)
        notification = create_notification(self.admin_user, internship)

        self.client.patch(internship_validate_url(internship.id))

        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        mock_generate_agreement.assert_called_once_with(
            internship, admin=self.admin_user,
        )

    def test_reject_marks_notification_as_read(self):
        """Rejecting an internship auto-marks related notifications as read."""
        internship = create_internship(self.student, self.company)
        notification = create_notification(self.admin_user, internship)

        self.client.patch(internship_reject_url(internship.id))

        notification.refresh_from_db()
        self.assertTrue(notification.is_read)


class AdminInternshipAgreementTests(TestCase):
    """Test internship agreement detail and download endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.admin_user = create_admin_user(self.university)
        self.student = create_student(self.university)
        self.company = create_company()
        self.internship = create_internship(self.student, self.company)
        self.client.force_authenticate(user=self.admin_user)

    def test_internship_detail_includes_agreement_metadata(self):
        agreement = create_internship_agreement(self.internship)

        res = self.client.get(internship_detail_url(self.internship.id))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('agreement', res.data)
        self.assertEqual(res.data['agreement']['id'], agreement.id)
        self.assertIn('/uploads/agreements/', res.data['agreement']['pdf_url'])
        self.assertTrue(res.data['agreement']['pdf_url'].endswith('.pdf'))
        self.assertIsNotNone(res.data['agreement']['generated_at'])

    def test_download_internship_agreement(self):
        create_internship_agreement(self.internship)

        res = self.client.get(internship_agreement_download_url(self.internship.id))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertIn(
            'attachment; filename="internship_agreement_',
            res['Content-Disposition'],
        )

    def test_download_internship_agreement_not_found(self):
        res = self.client.get(internship_agreement_download_url(self.internship.id))

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_download_internship_agreement_forbidden_for_other_university(self):
        create_internship_agreement(self.internship)
        other_university = create_university(name='Other University', code='OTH')
        other_admin = create_admin_user(
            other_university,
            email='otheradmin@example.com',
        )
        self.client.force_authenticate(user=other_admin)

        res = self.client.get(internship_agreement_download_url(self.internship.id))

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class PublicStatisticsApiTests(TestCase):
    """Test unauthenticated access to statistics endpoints is denied."""

    def setUp(self):
        self.client = APIClient()

    def test_statistics_summary_requires_auth(self):
        res = self.client.get(STATISTICS_SUMMARY_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_companies_requires_auth(self):
        res = self.client.get(STATISTICS_COMPANIES_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_wilayas_requires_auth(self):
        res = self.client.get(STATISTICS_WILAYAS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_trends_requires_auth(self):
        res = self.client.get(STATISTICS_TRENDS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_agreements_requires_auth(self):
        res = self.client.get(STATISTICS_AGREEMENTS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_statuses_requires_auth(self):
        res = self.client.get(STATISTICS_STATUSES_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_students_requires_auth(self):
        res = self.client.get(STATISTICS_STUDENTS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)



class NonAdminStatisticsAccessTests(TestCase):
    """Test that non-admin users cannot access statistics endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_student_cannot_access_statistics_summary(self):
        res = self.client.get(STATISTICS_SUMMARY_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class AdminStatisticsTests(TestCase):
    """Test statistics endpoints for administration dashboard."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.admin_user = create_admin_user(self.university)
        self.client.force_authenticate(user=self.admin_user)

        self.student_1 = create_student(
            self.university,
            email='student1@example.com',
            full_name='Student One',
            wilaya='16 - Alger',
        )
        self.student_2 = create_student(
            self.university,
            email='student2@example.com',
            full_name='Student Two',
            wilaya='31 - Oran',
        )
        self.student_3 = create_student(
            self.university,
            email='student3@example.com',
            full_name='Student Three',
            wilaya='25 - Constantine',
        )

        self.company_1 = create_company(
            email='company1@example.com',
            name='Company One',
            wilaya='09 - Blida',
        )
        self.company_2 = create_company(
            email='company2@example.com',
            name='Company Two',
            wilaya='19 - Sétif',
        )

        today = timezone.now().date()
        self.internship_accepted = create_internship(
            self.student_1,
            self.company_1,
            status=Internship.Status.ACCEPTED_BY_COMPANY,
            end_date=today + timezone.timedelta(days=50),
        )
        self.internship_validated = create_internship(
            self.student_2,
            self.company_1,
            status=Internship.Status.VALIDATED,
            end_date=today + timezone.timedelta(days=60),
        )
        self.internship_pending = create_internship(
            self.student_1,
            self.company_2,
            status=Internship.Status.PENDING,
            end_date=today + timezone.timedelta(days=5),
        )
        self.internship_rejected = create_internship(
            self.student_2,
            self.company_2,
            status=Internship.Status.REJECTED,
            end_date=today + timezone.timedelta(days=25),
        )

        create_internship_agreement(self.internship_validated)

        # Force internships into two different month buckets for trend checks.
        old_dt = timezone.now() - timezone.timedelta(days=40)
        recent_dt = timezone.now() - timezone.timedelta(days=3)
        Internship.objects.filter(pk=self.internship_accepted.pk).update(
            updated_at=old_dt,
        )
        Internship.objects.filter(pk=self.internship_validated.pk).update(
            updated_at=recent_dt,
        )
        Internship.objects.filter(pk=self.internship_pending.pk).update(
            updated_at=recent_dt,
        )
        Internship.objects.filter(pk=self.internship_rejected.pk).update(
            updated_at=old_dt,
        )

        # Foreign university data must not leak into admin statistics.
        other_uni = create_university(name='Other University', code='OTH')
        other_student = create_student(
            other_uni,
            email='otherstudent@example.com',
            full_name='Other Student',
        )
        other_company = create_company(
            email='othercompany@example.com',
            name='Other Company',
        )
        create_internship(
            other_student,
            other_company,
            status=Internship.Status.VALIDATED,
        )

    def test_statistics_summary(self):
        res = self.client.get(STATISTICS_SUMMARY_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['students']['total'], 3)
        self.assertEqual(res.data['students']['placed'], 2)
        self.assertEqual(res.data['students']['unplaced'], 1)
        self.assertEqual(res.data['students']['placement_rate'], 66.67)
        self.assertEqual(res.data['internships']['pending'], 1)
        self.assertEqual(res.data['internships']['accepted_by_company'], 1)
        self.assertEqual(res.data['internships']['validated'], 1)
        self.assertEqual(res.data['internships']['rejected'], 1)
        self.assertEqual(res.data['internships']['total'], 4)

    def test_statistics_companies(self):
        res = self.client.get(STATISTICS_COMPANIES_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['companies']), 2)

        first = res.data['companies'][0]
        second = res.data['companies'][1]

        self.assertEqual(first['company_name'], 'Company One')
        self.assertEqual(first['total_internships'], 2)
        self.assertEqual(first['accepted_by_company'], 1)
        self.assertEqual(first['validated'], 1)

        self.assertEqual(second['company_name'], 'Company Two')
        self.assertEqual(second['total_internships'], 2)
        self.assertEqual(second['pending'], 1)
        self.assertEqual(second['rejected'], 1)

    def test_statistics_wilayas_student_source(self):
        res = self.client.get(STATISTICS_WILAYAS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['source'], 'student')
        by_name = {
            row['wilaya']: row['internships_count']
            for row in res.data['distribution']
        }
        self.assertEqual(by_name['16 - Alger'], 2)
        self.assertEqual(by_name['31 - Oran'], 2)

    def test_statistics_wilayas_company_source(self):
        res = self.client.get(STATISTICS_WILAYAS_URL, {'source': 'company'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['source'], 'company')
        by_name = {
            row['wilaya']: row['internships_count']
            for row in res.data['distribution']
        }
        self.assertEqual(by_name['09 - Blida'], 2)
        self.assertEqual(by_name['19 - Sétif'], 2)

    def test_statistics_trends_monthly(self):
        res = self.client.get(STATISTICS_TRENDS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['period'], 'monthly')
        self.assertGreaterEqual(len(res.data['trends']), 2)

        total_placements = sum(item['placements'] for item in res.data['trends'])
        total_validations = sum(item['validations'] for item in res.data['trends'])
        self.assertEqual(total_placements, 2)
        self.assertEqual(total_validations, 1)

    def test_statistics_trends_weekly(self):
        res = self.client.get(STATISTICS_TRENDS_URL, {'period': 'weekly'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['period'], 'weekly')
        self.assertGreaterEqual(len(res.data['trends']), 2)

    def test_statistics_agreements(self):
        res = self.client.get(STATISTICS_AGREEMENTS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_internships'], 4)
        self.assertEqual(res.data['agreements_generated'], 1)
        self.assertEqual(res.data['agreements_missing'], 3)

    def test_statistics_statuses(self):
        res = self.client.get(STATISTICS_STATUSES_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['pending'], 1)
        self.assertEqual(res.data['accepted_by_company'], 1)
        self.assertEqual(res.data['validated'], 1)
        self.assertEqual(res.data['rejected'], 1)
        self.assertEqual(res.data['total'], 4)

    def test_statistics_students(self):
        res = self.client.get(STATISTICS_STUDENTS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_students'], 3)
        self.assertEqual(res.data['students_with_internships'], 2)
        self.assertEqual(res.data['students_without_internships'], 1)

    def test_statistics_company_detail(self):
        res = self.client.get(
            statistics_company_detail_url(self.company_1.id),
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['company_name'], 'Company One')
        self.assertEqual(res.data['total_internships'], 2)
        self.assertEqual(res.data['accepted_by_company'], 1)
        self.assertEqual(res.data['validated'], 1)
        self.assertEqual(res.data['company_placements'], 2)
        self.assertEqual(res.data['university_placements'], 2)
        self.assertEqual(res.data['placement_share_percent'], 100.0)

    def test_statistics_company_detail_not_found(self):
        other_company = create_company(
            email='nointernships@example.com',
            name='No Internships Company',
        )
        res = self.client.get(
            statistics_company_detail_url(other_company.id),
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)



