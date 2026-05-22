"""Tests for the user API (auth, registration, profile management)."""
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Student, Company, University, User


REGISTER_STUDENT_URL = reverse('user:register-student')
REGISTER_COMPANY_URL = reverse('user:register-company')
TOKEN_URL = reverse('user:token-obtain')
TOKEN_REFRESH_URL = reverse('user:token-refresh')
ME_URL = reverse('user:me')
STUDENT_UPDATE_URL = reverse('user:student-update')
COMPANY_UPDATE_URL = reverse('user:company-update')
UPLOAD_LOGO_URL = reverse('user:upload-logo')
UPLOAD_PROFILE_IMAGE_URL = reverse('user:upload-profile-image')


def delete_user_url(user_id):
    return reverse('user:admin-delete-user', args=[user_id])


def create_university(**params):
    defaults = {'name': 'Test University', 'code': 'TU01', 'wilaya': '16 - Alger'}
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
        'name': 'Test Company',
        'wilaya': '16 - Alger',
    }
    defaults.update(params)
    company = Company.objects.create_user(**defaults)
    company.role = 'company'
    company.save()
    return company


def create_staff_user(**params):
    defaults = {
        'email': 'staff@univ.dz',
        'password': 'testpass123',
        'role': User.Roles.ADMIN,
    }
    defaults.update(params)
    user = User.objects.create_user(**defaults)
    user.is_staff = True
    user.save()
    return user


# ── Student Registration ──────────────────────────────────────────────

class PublicStudentRegisterTests(TestCase):
    """Test student registration endpoint (no auth required)."""

    def setUp(self):
        self.client = APIClient()
        # Pre-seed a university so the email domain validation passes
        self.university = create_university(
            name='University Constantine 1 Mentouri',
            code='UC1',
            email_domain='univ-constantine1.dz',
            wilaya='25 - Constantine',
        )

    def test_register_student_success(self):
        """Valid payload creates a new student account."""
        payload = {
            'email': 'newstudent@univ-constantine1.dz',
            'password': 'strongpass123',
            'full_name': 'New Student',
            'wilaya': '31 - Oran',
        }
        res = self.client.post(REGISTER_STUDENT_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', res.data)
        student = Student.objects.get(email=payload['email'])
        self.assertEqual(student.role, 'student')

    def test_register_student_duplicate_email_fails(self):
        """Registration with an already-used email returns 400."""
        payload = {
            'email': 'dup@univ-constantine1.dz',
            'password': 'strongpass123',
            'full_name': 'Dup Student',
            'wilaya': '16 - Alger',
        }
        self.client.post(REGISTER_STUDENT_URL, payload)
        res = self.client.post(REGISTER_STUDENT_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_student_missing_email_fails(self):
        payload = {'password': 'pass', 'full_name': 'No Email', 'wilaya': 'Algiers'}
        res = self.client.post(REGISTER_STUDENT_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_student_short_password_fails(self):
        payload = {
            'email': 'short@univ-constantine1.dz',
            'password': '12',
            'full_name': 'Short Pass',
            'wilaya': '16 - Alger',
        }
        res = self.client.post(REGISTER_STUDENT_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── Company Registration ──────────────────────────────────────────────

class PublicCompanyRegisterTests(TestCase):
    """Test company registration endpoint (no auth required)."""

    def setUp(self):
        self.client = APIClient()

    def test_register_company_success(self):
        """Valid payload creates a new company account."""
        payload = {
            'email': 'newcomp@test.com',
            'password': 'strongpass123',
            'name': 'New Corp',
            'wilaya': '09 - Blida',
        }
        res = self.client.post(REGISTER_COMPANY_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', res.data)
        company = Company.objects.get(email=payload['email'])
        self.assertEqual(company.role, 'company')

    def test_register_company_duplicate_email_fails(self):
        payload = {
            'email': 'dupco@test.com',
            'password': 'strongpass123',
            'name': 'Dup Corp',
            'wilaya': '16 - Alger',
        }
        self.client.post(REGISTER_COMPANY_URL, payload)
        res = self.client.post(REGISTER_COMPANY_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_company_missing_name_fails(self):
        payload = {'email': 'noname@test.com', 'password': 'pass123', 'wilaya': 'Algiers'}
        res = self.client.post(REGISTER_COMPANY_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── Token Authentication ──────────────────────────────────────────────

class TokenTests(TestCase):
    """Test JWT token obtain and refresh."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)

    def test_obtain_token_success(self):
        """Correct credentials return access and refresh tokens."""
        res = self.client.post(TOKEN_URL, {
            'email': 'student@univ.dz',
            'password': 'testpass123',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_obtain_token_wrong_password(self):
        """Wrong password returns 401."""
        res = self.client.post(TOKEN_URL, {
            'email': 'student@univ.dz',
            'password': 'wrongpassword',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_nonexistent_user(self):
        """Non-existent email returns 401."""
        res = self.client.post(TOKEN_URL, {
            'email': 'nobody@univ.dz',
            'password': 'testpass123',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token(self):
        """A valid refresh token returns a new access token."""
        token_res = self.client.post(TOKEN_URL, {
            'email': 'student@univ.dz',
            'password': 'testpass123',
        })
        refresh = token_res.data['refresh']

        res = self.client.post(TOKEN_REFRESH_URL, {'refresh': refresh})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)


# ── GET/PATCH /me/ ────────────────────────────────────────────────────

class ManageUserTests(TestCase):
    """Test GET and PATCH on /api/user/me/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_get_me_returns_user_data(self):
        res = self.client.get(ME_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], self.student.email)

    def test_me_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(ME_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_me_not_allowed(self):
        """POST is not supported on the me endpoint."""
        res = self.client.post(ME_URL, {})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


# ── Student Profile Update ────────────────────────────────────────────

class StudentProfileUpdateTests(TestCase):
    """Test GET/PATCH /api/user/me/student/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_get_student_profile(self):
        res = self.client.get(STUDENT_UPDATE_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['full_name'], self.student.full_name)

    def test_patch_student_profile(self):
        res = self.client.patch(STUDENT_UPDATE_URL, {
            'full_name': 'Updated Name',
            'wilaya': '25 - Constantine',
            'date_of_birth': '2000-01-01',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.full_name, 'Updated Name')
        self.assertEqual(self.student.wilaya, '25 - Constantine')
        self.assertEqual(str(self.student.date_of_birth), '2000-01-01')

    def test_company_cannot_access_student_profile(self):
        company = create_company(email='co2@test.com')
        self.client.force_authenticate(user=company)
        res = self.client.get(STUDENT_UPDATE_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ── Company Profile Update ────────────────────────────────────────────

class CompanyProfileUpdateTests(TestCase):
    """Test GET/PATCH /api/user/me/company/."""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.client.force_authenticate(user=self.company)

    def test_get_company_profile(self):
        res = self.client.get(COMPANY_UPDATE_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name'], self.company.name)

    def test_patch_company_profile(self):
        res = self.client.patch(COMPANY_UPDATE_URL, {
            'name': 'Updated Corp',
            'wilaya': '19 - Sétif',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.company.refresh_from_db()
        self.assertEqual(self.company.name, 'Updated Corp')

    def test_student_cannot_access_company_profile(self):
        university = create_university()
        student = create_student(university, email='s2@test.com')
        self.client.force_authenticate(user=student)
        res = self.client.get(COMPANY_UPDATE_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ── Admin Delete User ─────────────────────────────────────────────────

class AdminDeleteUserTests(TestCase):
    """Test DELETE /api/user/<id>/delete/ (staff-only)."""

    def setUp(self):
        self.client = APIClient()
        self.staff = create_staff_user()
        self.university = create_university()
        self.target = create_student(self.university, email='target@test.com')
        self.client.force_authenticate(user=self.staff)

    def test_staff_can_delete_user(self):
        res = self.client.delete(delete_user_url(self.target.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.target.id).exists())

    def test_non_staff_cannot_delete_user(self):
        normal_student = create_student(
            self.university, email='normal@test.com',
        )
        self.client.force_authenticate(user=normal_student)
        res = self.client.delete(delete_user_url(self.target.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_nonexistent_user_returns_404(self):
        res = self.client.delete(delete_user_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_cannot_delete_user(self):
        self.client.force_authenticate(user=None)
        res = self.client.delete(delete_user_url(self.target.id))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Company Logo Upload ───────────────────────────────────────────────

class CompanyLogoUploadTests(TestCase):
    """Test PATCH /api/user/me/upload-logo/."""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.client.force_authenticate(user=self.company)

    def test_upload_logo_success(self):
        """Valid image upload updates the logo field."""
        import tempfile
        from PIL import Image

        with tempfile.NamedTemporaryFile(suffix='.jpg') as img_file:
            img = Image.new('RGB', (100, 100))
            img.save(img_file, format='JPEG')
            img_file.seek(0)
            res = self.client.patch(
                UPLOAD_LOGO_URL,
                {'logo': img_file},
                format='multipart',
            )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.company.refresh_from_db()
        self.assertTrue(self.company.logo)

    def test_upload_logo_no_file_is_noop(self):
        """PATCH with no file is a no-op partial update (200)."""
        res = self.client.patch(UPLOAD_LOGO_URL, {}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.company.refresh_from_db()
        self.assertFalse(self.company.logo)

    def test_student_cannot_upload_logo(self):
        """Students are forbidden from the logo upload endpoint."""
        university = create_university()
        student = create_student(university, email='logostudent@univ.dz')
        self.client.force_authenticate(user=student)
        res = self.client.patch(UPLOAD_LOGO_URL, {}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_upload_logo(self):
        self.client.force_authenticate(user=None)
        res = self.client.patch(UPLOAD_LOGO_URL, {}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Student Profile Image Upload ──────────────────────────────────────

class StudentProfileImageUploadTests(TestCase):
    """Test PATCH /api/user/me/upload-profile-image/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_upload_profile_image_success(self):
        """Valid image upload updates the profile_image field."""
        import tempfile
        from PIL import Image

        with tempfile.NamedTemporaryFile(suffix='.png') as img_file:
            img = Image.new('RGB', (200, 200))
            img.save(img_file, format='PNG')
            img_file.seek(0)
            res = self.client.patch(
                UPLOAD_PROFILE_IMAGE_URL,
                {'profile_image': img_file},
                format='multipart',
            )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertTrue(self.student.profile_image)

    def test_upload_profile_image_no_file_is_noop(self):
        """PATCH with no file is a no-op partial update (200)."""
        res = self.client.patch(
            UPLOAD_PROFILE_IMAGE_URL, {}, format='multipart',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertFalse(self.student.profile_image)

    def test_company_cannot_upload_profile_image(self):
        """Companies are forbidden from the profile image endpoint."""
        company = create_company(email='imgco@test.com')
        self.client.force_authenticate(user=company)
        res = self.client.patch(
            UPLOAD_PROFILE_IMAGE_URL, {}, format='multipart',
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_upload_profile_image(self):
        self.client.force_authenticate(user=None)
        res = self.client.patch(
            UPLOAD_PROFILE_IMAGE_URL, {}, format='multipart',
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
