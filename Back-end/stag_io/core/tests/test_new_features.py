"""
Tests for new features:
1. University-based email domain validation on student registration
2. Auto-assignment of university based on email domain
3. Student cannot change university via Digital CV
4. Admin notification university scoping
5. seed_universities management command
6. Remote internship creation (company)
7. Remote internship filter (student)
"""
from datetime import date
from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    University, Student, Company, Admin,
    Internship, InternshipOffer, Notification,
)


# ── URL constants ─────────────────────────────────────────────────────

REGISTER_STUDENT_URL = reverse('user:register-student')
DIGITAL_CV_URL = reverse('student:digital-cv')
OFFER_LIST_URL = reverse('student:offer-list')
COMPANY_OFFER_URL = reverse('company:offer-list-create')
NOTIFICATION_LIST_URL = reverse('administration:notification-list')
NOTIFICATION_UNREAD_URL = reverse('administration:notification-unread')


def offer_detail_url(offer_id):
    return reverse('company:offer-detail', args=[offer_id])


# ── Helpers ───────────────────────────────────────────────────────────

def create_university(**params):
    defaults = {
        'name': 'Uni', 'code': 'U1',
        'email_domain': 'test-u1.dz', 'wilaya': '16 - Alger',
    }
    defaults.update(params)
    return University.objects.create(**defaults)


def create_student(university, **params):
    defaults = {
        'email': 'student@test.dz',
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
        'email': 'company@test.com',
        'password': 'testpass123',
        'name': 'Test Corp',
        'wilaya': '16 - Alger',
    }
    defaults.update(params)
    c = Company.objects.create_user(**defaults)
    c.role = 'company'
    c.save()
    return c


def create_admin(university, **params):
    defaults = {
        'email': 'admin@test.com',
        'password': 'testpass123',
        'department': 'CS',
        'title': 'Administrator',
    }
    defaults.update(params)
    pw = defaults.pop('password')
    a = Admin(university=university, role='admin', **defaults)
    a.set_password(pw)
    a.is_staff = True
    a.save()
    return a


def create_offer(company, **params):
    defaults = {
        'title': 'Django Dev Internship',
        'description': 'Build APIs with Django.',
        'location': '16 - Alger',
        'wilaya': '16 - Alger',
        'type': InternshipOffer.Type.UNPAID,
        'start_date': date(2026, 7, 1),
        'end_date': date(2026, 8, 31),
        'status': InternshipOffer.Status.OPEN,
    }
    defaults.update(params)
    return InternshipOffer.objects.create(company=company, **defaults)


# ══════════════════════════════════════════════════════════════════════
# 1. STUDENT REGISTRATION — EMAIL DOMAIN VALIDATION
# ══════════════════════════════════════════════════════════════════════

class StudentRegistrationEmailDomainTests(TestCase):
    """
    Students can only register with one of the 5 predefined
    university email domains. The university is auto-assigned.
    """

    def setUp(self):
        self.client = APIClient()
        # Seed the 5 universities
        self.uc1 = create_university(
            name='University Constantine 1 Mentouri',
            code='UC1', email_domain='univ-constantine1.dz',
            wilaya='25 - Constantine',
        )
        self.uc2 = create_university(
            name='University Constantine 2',
            code='UC2', email_domain='univ-constantine2.dz',
            wilaya='25 - Constantine',
        )
        self.usthb = create_university(
            name='University Alger USTHB',
            code='USTHB', email_domain='univ-usthb.dz',
            wilaya='16 - Alger',
        )

    def test_register_with_valid_constantine1_email(self):
        """Registration succeeds with @univ-constantine1.dz."""
        payload = {
            'email': 'ahmed@univ-constantine1.dz',
            'password': 'strongpass123',
            'full_name': 'Ahmed Benali',
            'wilaya': '25 - Constantine',
        }
        res = self.client.post(REGISTER_STUDENT_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        student = Student.objects.get(email='ahmed@univ-constantine1.dz')
        self.assertEqual(student.university, self.uc1)

    def test_register_with_valid_usthb_email(self):
        """Registration succeeds with @univ-usthb.dz."""
        payload = {
            'email': 'sara@univ-usthb.dz',
            'password': 'strongpass123',
            'full_name': 'Sara Boudiaf',
            'wilaya': '16 - Alger',
        }
        res = self.client.post(REGISTER_STUDENT_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        student = Student.objects.get(email='sara@univ-usthb.dz')
        self.assertEqual(student.university, self.usthb)

    def test_register_with_invalid_email_domain_fails(self):
        """Registration with a non-university email returns 400."""
        payload = {
            'email': 'student@gmail.com',
            'password': 'strongpass123',
            'full_name': 'Bad Domain',
            'wilaya': '16 - Alger',
        }
        res = self.client.post(REGISTER_STUDENT_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data)

    def test_register_with_generic_univ_dz_fails(self):
        """Old generic @univ.dz domain is no longer accepted."""
        payload = {
            'email': 'student@univ.dz',
            'password': 'strongpass123',
            'full_name': 'Old Domain',
            'wilaya': '16 - Alger',
        }
        res = self.client.post(REGISTER_STUDENT_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_auto_assigns_correct_university_constantine2(self):
        """Student with @univ-constantine2.dz gets auto-linked to UC2."""
        payload = {
            'email': 'karim@univ-constantine2.dz',
            'password': 'strongpass123',
            'full_name': 'Karim Hadj',
            'wilaya': '25 - Constantine',
        }
        res = self.client.post(REGISTER_STUDENT_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        student = Student.objects.get(email='karim@univ-constantine2.dz')
        self.assertEqual(student.university.code, 'UC2')
        self.assertEqual(student.university.name, 'University Constantine 2')

    def test_university_assignment_is_permanent(self):
        """After registration, the student's university cannot be changed via CV."""
        payload = {
            'email': 'fixed@univ-constantine1.dz',
            'password': 'strongpass123',
            'full_name': 'Fixed Student',
            'wilaya': '25 - Constantine',
        }
        self.client.post(REGISTER_STUDENT_URL, payload)
        student = Student.objects.get(email='fixed@univ-constantine1.dz')

        # Authenticate and try to change university via CV
        self.client.force_authenticate(user=student)
        res = self.client.patch(DIGITAL_CV_URL, {
            'university_id': self.usthb.id,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        student.refresh_from_db()
        # University should still be UC1
        self.assertEqual(student.university, self.uc1)


# ══════════════════════════════════════════════════════════════════════
# 2. DIGITAL CV — UNIVERSITY IS READ-ONLY
# ══════════════════════════════════════════════════════════════════════

class DigitalCVUniversityReadOnlyTests(TestCase):
    """University shown on Digital CV but cannot be changed."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university(
            code='UC1', email_domain='univ-constantine1.dz',
            wilaya='25 - Constantine',
        )
        self.other_uni = create_university(
            name='Other Uni', code='OTH', email_domain='other.dz',
        )
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_cv_shows_university_info(self):
        """GET cv/ includes university name and code."""
        res = self.client.get(DIGITAL_CV_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['university']['name'], self.university.name)

    def test_patch_cv_does_not_change_university(self):
        """PATCH cv/ with university_id is silently ignored."""
        res = self.client.patch(DIGITAL_CV_URL, {
            'university_id': self.other_uni.id,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.university, self.university)

    def test_patch_cv_academic_fields_work(self):
        """Academic fields are still editable."""
        res = self.client.patch(DIGITAL_CV_URL, {
            'academic_year': 'year_4',
            'professional_summary': 'Updated!',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.academic_year, 'year_4')
        self.assertEqual(self.student.professional_summary, 'Updated!')


# ══════════════════════════════════════════════════════════════════════
# 3. ADMIN NOTIFICATIONS — UNIVERSITY SCOPING
# ══════════════════════════════════════════════════════════════════════

class AdminNotificationUniversityScopeTests(TestCase):
    """Admin only sees notifications for students from their university."""

    def setUp(self):
        self.client = APIClient()
        self.uni_a = create_university(
            name='Uni A', code='A', email_domain='uni-a.dz',
        )
        self.uni_b = create_university(
            name='Uni B', code='B', email_domain='uni-b.dz',
        )
        self.admin_a = create_admin(self.uni_a, email='admin_a@test.com')
        self.admin_b = create_admin(self.uni_b, email='admin_b@test.com')

        self.student_a = create_student(
            self.uni_a, email='sa@test.dz', full_name='Student A',
        )
        self.student_b = create_student(
            self.uni_b, email='sb@test.dz', full_name='Student B',
        )
        self.company = create_company()

        # Create internships
        self.internship_a = Internship.objects.create(
            student=self.student_a, company=self.company,
            subject='Int A', description='Desc',
            start_date=date(2026, 7, 1), end_date=date(2026, 8, 31),
            status=Internship.Status.ACCEPTED_BY_COMPANY,
        )
        self.internship_b = Internship.objects.create(
            student=self.student_b, company=self.company,
            subject='Int B', description='Desc',
            start_date=date(2026, 7, 1), end_date=date(2026, 8, 31),
            status=Internship.Status.ACCEPTED_BY_COMPANY,
        )

        # Create notifications for both admins
        Notification.objects.create(
            recipient=self.admin_a, internship=self.internship_a,
            notification_type=Notification.Type.INTERNSHIP_ACCEPTED,
            message='Student A accepted',
        )
        Notification.objects.create(
            recipient=self.admin_a, internship=self.internship_b,
            notification_type=Notification.Type.INTERNSHIP_ACCEPTED,
            message='Student B accepted (should be filtered out)',
        )

    def test_admin_a_only_sees_uni_a_notifications(self):
        """Admin A only sees notifications for Uni A students."""
        self.client.force_authenticate(user=self.admin_a)
        res = self.client.get(NOTIFICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Only the notification for student_a (uni A) should appear
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['student_name'], 'Student A')

    def test_admin_a_unread_only_uni_a(self):
        """Admin A's unread list is also scoped to their university."""
        self.client.force_authenticate(user=self.admin_a)
        res = self.client.get(NOTIFICATION_UNREAD_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)


# ══════════════════════════════════════════════════════════════════════
# 4. SEED UNIVERSITIES MANAGEMENT COMMAND
# ══════════════════════════════════════════════════════════════════════

class SeedUniversitiesCommandTests(TestCase):
    """Test the seed_universities management command."""

    def test_seed_creates_five_universities(self):
        """Running seed_universities creates all 5 universities."""
        out = StringIO()
        call_command('seed_universities', stdout=out)

        self.assertEqual(University.objects.count(), 5)
        codes = set(University.objects.values_list('code', flat=True))
        self.assertEqual(codes, {'UC1', 'UC2', 'UC3', 'US1', 'USTHB'})

    def test_seed_creates_five_admin_accounts(self):
        """Running seed_universities creates 5 admin accounts."""
        out = StringIO()
        call_command('seed_universities', stdout=out)

        self.assertEqual(Admin.objects.count(), 5)
        admin_emails = set(Admin.objects.values_list('email', flat=True))
        expected = {
            'admin@univ-constantine1.dz',
            'admin@univ-constantine2.dz',
            'admin@univ-constantine3.dz',
            'admin@univ-setif1.dz',
            'admin@univ-usthb.dz',
        }
        self.assertEqual(admin_emails, expected)

    def test_seed_is_idempotent(self):
        """Running the command twice does not duplicate data."""
        out = StringIO()
        call_command('seed_universities', stdout=out)
        call_command('seed_universities', stdout=out)

        self.assertEqual(University.objects.count(), 5)
        self.assertEqual(Admin.objects.count(), 5)

    def test_seed_links_admins_to_correct_universities(self):
        """Each admin is linked to the correct university."""
        out = StringIO()
        call_command('seed_universities', stdout=out)

        admin_uc1 = Admin.objects.get(email='admin@univ-constantine1.dz')
        self.assertEqual(admin_uc1.university.code, 'UC1')

        admin_usthb = Admin.objects.get(email='admin@univ-usthb.dz')
        self.assertEqual(admin_usthb.university.code, 'USTHB')

    def test_seed_sets_email_domains(self):
        """Universities get their email_domain set correctly."""
        out = StringIO()
        call_command('seed_universities', stdout=out)

        uc1 = University.objects.get(code='UC1')
        self.assertEqual(uc1.email_domain, 'univ-constantine1.dz')

        usthb = University.objects.get(code='USTHB')
        self.assertEqual(usthb.email_domain, 'univ-usthb.dz')

    def test_admin_password_is_set(self):
        """Admin accounts have a usable password after seeding."""
        out = StringIO()
        call_command('seed_universities', stdout=out)

        admin = Admin.objects.get(email='admin@univ-constantine1.dz')
        self.assertTrue(admin.check_password('admin12345'))


# ══════════════════════════════════════════════════════════════════════
# 5. REMOTE INTERNSHIP — COMPANY OFFER CREATION
# ══════════════════════════════════════════════════════════════════════

class RemoteOfferCreationTests(TestCase):
    """Company can create remote internship offers."""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.client.force_authenticate(user=self.company)

    def test_create_remote_offer_success(self):
        """Remote offer creation succeeds without location/wilaya."""
        payload = {
            'title': 'Remote Python Internship',
            'description': 'Work from home.',
            'is_remote': True,
            'type': 'unpaid',
            'start_date': '2026-07-01',
            'end_date': '2026-09-30',
        }
        res = self.client.post(COMPANY_OFFER_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        offer = InternshipOffer.objects.get(title='Remote Python Internship')
        self.assertTrue(offer.is_remote)
        self.assertEqual(offer.location, '')
        self.assertEqual(offer.wilaya, '')

    def test_remote_offer_clears_location_and_wilaya(self):
        """Even if location/wilaya sent, they are cleared for remote offers."""
        payload = {
            'title': 'Remote with Location',
            'description': 'Should ignore location.',
            'is_remote': True,
            'location': 'Should be cleared',
            'wilaya': '16 - Alger',
            'type': 'unpaid',
            'start_date': '2026-07-01',
            'end_date': '2026-09-30',
        }
        res = self.client.post(COMPANY_OFFER_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        offer = InternshipOffer.objects.get(title='Remote with Location')
        self.assertEqual(offer.location, '')
        self.assertEqual(offer.wilaya, '')

    def test_non_remote_offer_requires_location(self):
        """Non-remote offer without location returns 400."""
        payload = {
            'title': 'On-site Offer',
            'description': 'Missing location.',
            'is_remote': False,
            'type': 'unpaid',
            'start_date': '2026-07-01',
            'end_date': '2026-09-30',
        }
        res = self.client.post(COMPANY_OFFER_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_remote_offer_with_location_succeeds(self):
        """Non-remote offer with location succeeds."""
        payload = {
            'title': 'On-site Offer',
            'description': 'Has location.',
            'is_remote': False,
            'location': 'Downtown Office',
            'wilaya': '16 - Alger',
            'type': 'unpaid',
            'start_date': '2026-07-01',
            'end_date': '2026-09-30',
        }
        res = self.client.post(COMPANY_OFFER_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        offer = InternshipOffer.objects.get(title='On-site Offer')
        self.assertFalse(offer.is_remote)
        self.assertEqual(offer.location, 'Downtown Office')

    def test_update_offer_to_remote_clears_location(self):
        """PATCH an existing offer to remote clears location/wilaya."""
        offer = create_offer(self.company)
        self.assertFalse(offer.is_remote)

        res = self.client.patch(
            offer_detail_url(offer.id),
            {'is_remote': True},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        offer.refresh_from_db()
        self.assertTrue(offer.is_remote)
        self.assertEqual(offer.location, '')
        self.assertEqual(offer.wilaya, '')

    def test_offer_response_includes_is_remote(self):
        """GET offer response includes the is_remote field."""
        offer = create_offer(self.company, is_remote=True, location='', wilaya='')
        res = self.client.get(offer_detail_url(offer.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_remote'])


# ══════════════════════════════════════════════════════════════════════
# 6. REMOTE INTERNSHIP — STUDENT FILTER
# ══════════════════════════════════════════════════════════════════════

class StudentRemoteOfferFilterTests(TestCase):
    """Student can filter offers to show only remote internships."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.client.force_authenticate(user=self.student)

        # Create a mix of remote and non-remote offers
        self.remote_offer = create_offer(
            self.company,
            title='Remote AI Internship',
            is_remote=True,
            location='',
            wilaya='',
        )
        self.onsite_offer_1 = create_offer(
            self.company,
            title='On-site Django Internship',
            is_remote=False,
        )
        self.onsite_offer_2 = create_offer(
            self.company,
            title='On-site React Internship',
            is_remote=False,
        )

    def test_filter_remote_only(self):
        """?remote=true returns only remote offers."""
        res = self.client.get(OFFER_LIST_URL, {'remote': 'true'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'Remote AI Internship')
        self.assertTrue(res.data[0]['is_remote'])

    def test_no_remote_filter_returns_all(self):
        """Without remote filter, all offers are returned."""
        res = self.client.get(OFFER_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)

    def test_remote_false_returns_all(self):
        """?remote=false does NOT filter (returns all)."""
        res = self.client.get(OFFER_LIST_URL, {'remote': 'false'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)

    def test_offer_detail_shows_is_remote(self):
        """Offer detail endpoint includes is_remote field."""
        detail_url = reverse('student:offer-detail', args=[self.remote_offer.id])
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_remote'])

    def test_remote_filter_combined_with_search(self):
        """Remote filter works alongside other filters."""
        # Add another remote offer
        create_offer(
            self.company,
            title='Remote React Internship',
            is_remote=True,
            location='',
            wilaya='',
        )

        res = self.client.get(OFFER_LIST_URL, {
            'remote': 'true',
            'search': 'React',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'Remote React Internship')
