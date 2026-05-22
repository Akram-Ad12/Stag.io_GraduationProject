"""Tests for shared notification endpoints (/api/notifications/)."""
from datetime import date

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    University, Student, Company, Internship, Notification,
)


NOTIFICATION_LIST_URL = reverse('notification-list')
NOTIFICATION_UNREAD_URL = reverse('notification-unread')
NOTIFICATION_READ_ALL_URL = reverse('notification-read-all')


def notification_read_url(pk):
    return reverse('notification-read', args=[pk])


# ── Helpers ───────────────────────────────────────────────────────────

def create_university(**params):
    defaults = {'name': 'Uni', 'code': 'U1', 'wilaya': '16 - Alger'}
    defaults.update(params)
    return University.objects.create(**defaults)


def create_student(university, **params):
    defaults = {
        'email': 'student@univ.dz',
        'password': 'testpass123',
        'full_name': 'Test Student',
        'wilaya': '16 - Alger',
    }
    defaults.update(params)
    pw = defaults.pop('password')
    s = Student(university=university, role='student', **defaults)
    s.set_password(pw)
    s.save()
    return s


def create_company(**params):
    defaults = {
        'email': 'company@univ.dz',
        'password': 'testpass123',
        'name': 'Test Corp',
        'wilaya': '16 - Alger',
    }
    defaults.update(params)
    c = Company.objects.create_user(**defaults)
    c.role = 'company'
    c.save()
    return c


def create_internship(student, company, **params):
    defaults = {
        'subject': 'Django Dev',
        'description': 'Build APIs',
        'start_date': date(2026, 7, 1),
        'end_date': date(2026, 8, 31),
        'status': Internship.Status.PENDING,
    }
    defaults.update(params)
    return Internship.objects.create(student=student, company=company, **defaults)


def create_notification(recipient, internship, **params):
    defaults = {
        'notification_type': Notification.Type.APPLICATION_SUBMITTED,
        'message': 'Test notification',
        'is_read': False,
    }
    defaults.update(params)
    return Notification.objects.create(
        recipient=recipient, internship=internship, **defaults,
    )


# ── Unauthenticated Access ────────────────────────────────────────────

class PublicNotificationTests(TestCase):
    """Unauthenticated access to all notification endpoints is denied."""

    def setUp(self):
        self.client = APIClient()

    def test_notification_list_requires_auth(self):
        res = self.client.get(NOTIFICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_notification_unread_requires_auth(self):
        res = self.client.get(NOTIFICATION_UNREAD_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_notification_read_all_requires_auth(self):
        res = self.client.patch(NOTIFICATION_READ_ALL_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_notification_read_requires_auth(self):
        res = self.client.patch(notification_read_url(1))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Student Notification Tests ────────────────────────────────────────

class StudentNotificationTests(TestCase):
    """Notification behaviour for the student role."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.internship = create_internship(self.student, self.company)
        self.client.force_authenticate(user=self.student)

    def test_list_notifications_returns_own_only(self):
        create_notification(self.student, self.internship)
        # Create a notification for a different user to ensure isolation
        other_student = create_student(
            self.university, email='other@test.com',
        )
        other_internship = create_internship(other_student, self.company)
        create_notification(other_student, other_internship)

        res = self.client.get(NOTIFICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_list_unread_notifications_only_unread(self):
        create_notification(self.student, self.internship, is_read=False)
        create_notification(self.student, self.internship, is_read=True)

        res = self.client.get(NOTIFICATION_UNREAD_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertFalse(res.data[0]['is_read'])

    def test_mark_single_notification_as_read(self):
        notification = create_notification(self.student, self.internship)
        res = self.client.patch(notification_read_url(notification.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_mark_notification_not_found_returns_404(self):
        res = self.client.patch(notification_read_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_mark_other_users_notification_as_read(self):
        other_student = create_student(
            self.university, email='other@test.com',
        )
        other_internship = create_internship(other_student, self.company)
        notification = create_notification(other_student, other_internship)

        res = self.client.patch(notification_read_url(notification.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_notifications_as_read(self):
        create_notification(self.student, self.internship, is_read=False)
        create_notification(self.student, self.internship, is_read=False)

        res = self.client.patch(NOTIFICATION_READ_ALL_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('2 notifications marked as read', res.data['detail'])

        unread_count = Notification.objects.filter(
            recipient=self.student, is_read=False,
        ).count()
        self.assertEqual(unread_count, 0)

    def test_mark_all_read_when_none_unread_returns_zero(self):
        create_notification(self.student, self.internship, is_read=True)

        res = self.client.patch(NOTIFICATION_READ_ALL_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('0 notifications marked as read', res.data['detail'])


# ── Company Notification Tests ────────────────────────────────────────

class CompanyNotificationTests(TestCase):
    """Notification behaviour for the company role."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.internship = create_internship(self.student, self.company)
        self.client.force_authenticate(user=self.company)

    def test_company_can_list_own_notifications(self):
        create_notification(
            self.company, self.internship,
            notification_type=Notification.Type.NEW_APPLICANT,
            message='New applicant applied',
        )
        res = self.client.get(NOTIFICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_company_cannot_see_student_notifications(self):
        create_notification(self.student, self.internship)
        res = self.client.get(NOTIFICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_company_mark_all_as_read(self):
        create_notification(self.company, self.internship, is_read=False)
        create_notification(self.company, self.internship, is_read=False)

        res = self.client.patch(NOTIFICATION_READ_ALL_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        unread = Notification.objects.filter(
            recipient=self.company, is_read=False,
        ).count()
        self.assertEqual(unread, 0)
