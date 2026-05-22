"""Tests for the student API endpoints (skills, offers, applications)."""
from datetime import date

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    University, Student, Company, Internship, InternshipOffer,
    InternshipAgreement,
)
from student.models import Skill, StudentSkill
from django.core.files.base import ContentFile


# ── URL helpers ───────────────────────────────────────────────────────

SKILL_LIST_URL = reverse('student:skill-list')
MY_SKILLS_URL = reverse('student:my-skills')
ADD_SKILL_URL = reverse('student:add-skill')
OFFER_LIST_URL = reverse('student:offer-list')
APPLICATION_LIST_URL = reverse('student:application-list')
DOCUMENT_LIST_URL = reverse('student:document-list')
DIGITAL_CV_URL = reverse('student:digital-cv')


def remove_skill_url(student_skill_id):
    return reverse('student:remove-skill', args=[student_skill_id])


def offer_detail_url(offer_id):
    return reverse('student:offer-detail', args=[offer_id])


def apply_url(offer_id):
    return reverse('student:apply', args=[offer_id])


def application_detail_url(app_id):
    return reverse('student:application-detail', args=[app_id])


def application_document_url(app_id):
    return reverse('student:application-document', args=[app_id])


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


def create_internship(student, company, offer=None, **params):
    defaults = {
        'subject': 'Django Dev',
        'description': 'Build APIs',
        'start_date': date(2026, 7, 1),
        'end_date': date(2026, 8, 31),
        'status': Internship.Status.PENDING,
    }
    defaults.update(params)
    return Internship.objects.create(
        student=student, company=company, offer=offer, **defaults,
    )


# ── Skill List ────────────────────────────────────────────────────────

class SkillListTests(TestCase):
    """GET /api/student/skills/ — returns all skills (authenticated)."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        Skill.objects.create(name='Python')
        Skill.objects.create(name='React')

    def test_list_skills_authenticated(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(SKILL_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_list_skills_unauthenticated_returns_401(self):
        res = self.client.get(SKILL_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── My Skills ─────────────────────────────────────────────────────────

class MySkillTests(TestCase):
    """GET /api/student/me/skills/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.skill = Skill.objects.create(name='Django')
        self.client.force_authenticate(user=self.student)

    def test_get_my_skills_empty(self):
        res = self.client.get(MY_SKILLS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_get_my_skills_with_one_skill(self):
        StudentSkill.objects.create(student=self.student, skill=self.skill)
        res = self.client.get(MY_SKILLS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_company_cannot_access_my_skills(self):
        company = create_company(email='co@test.com')
        self.client.force_authenticate(user=company)
        res = self.client.get(MY_SKILLS_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ── Add Skill ─────────────────────────────────────────────────────────

class AddSkillTests(TestCase):
    """POST /api/student/me/skills/add/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.skill = Skill.objects.create(name='Vue.js')
        self.client.force_authenticate(user=self.student)

    def test_add_skill_success(self):
        res = self.client.post(ADD_SKILL_URL, {'skill_id': self.skill.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            StudentSkill.objects.filter(
                student=self.student, skill=self.skill,
            ).exists()
        )

    def test_add_duplicate_skill_fails(self):
        StudentSkill.objects.create(student=self.student, skill=self.skill)
        res = self.client.post(ADD_SKILL_URL, {'skill_id': self.skill.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already have this skill', res.data['detail'])

    def test_add_skill_missing_id_fails(self):
        res = self.client.post(ADD_SKILL_URL, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_company_cannot_add_skill(self):
        company = create_company(email='co@test.com')
        self.client.force_authenticate(user=company)
        res = self.client.post(ADD_SKILL_URL, {'skill_id': self.skill.id})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ── Remove Skill ──────────────────────────────────────────────────────

class RemoveSkillTests(TestCase):
    """DELETE /api/student/me/skills/<id>/remove/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.skill = Skill.objects.create(name='Node.js')
        self.student_skill = StudentSkill.objects.create(
            student=self.student, skill=self.skill,
        )
        self.client.force_authenticate(user=self.student)

    def test_remove_skill_success(self):
        res = self.client.delete(remove_skill_url(self.student_skill.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            StudentSkill.objects.filter(pk=self.student_skill.id).exists()
        )

    def test_remove_nonexistent_skill_returns_404(self):
        res = self.client.delete(remove_skill_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_remove_another_students_skill(self):
        other_student = create_student(
            self.university, email='other@test.com',
        )
        self.client.force_authenticate(user=other_student)
        res = self.client.delete(remove_skill_url(self.student_skill.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ── Offer List ────────────────────────────────────────────────────────

class OfferListTests(TestCase):
    """GET /api/student/offers/ — browse open offers."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.client.force_authenticate(user=self.student)

    def test_list_open_offers(self):
        create_offer(self.company)
        res = self.client.get(OFFER_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_closed_offers_excluded(self):
        create_offer(self.company, status=InternshipOffer.Status.CLOSED)
        res = self.client.get(OFFER_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_filter_by_type_paid(self):
        create_offer(
            self.company, title='Paid Offer',
            type=InternshipOffer.Type.PAID, salary_per_week=5000,
        )
        create_offer(
            self.company,
            title='Unpaid Offer',
            type=InternshipOffer.Type.UNPAID,
        )
        res = self.client.get(OFFER_LIST_URL, {'type': 'paid'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'Paid Offer')

    def test_filter_by_wilaya(self):
        create_offer(self.company, wilaya='31 - Oran', title='Oran Offer')
        create_offer(
            self.company, wilaya='19 - Sétif', title='Setif Offer',
        )
        res = self.client.get(OFFER_LIST_URL, {'wilaya': '31 - Oran'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_search_by_title(self):
        create_offer(self.company, title='Python Backend Internship')
        create_offer(self.company, title='Frontend Design Role')
        res = self.client.get(OFFER_LIST_URL, {'search': 'Python'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_company_cannot_access_student_offer_list(self):
        self.client.force_authenticate(user=self.company)
        res = self.client.get(OFFER_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_list_offers(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(OFFER_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Offer Detail ──────────────────────────────────────────────────────

class OfferDetailTests(TestCase):
    """GET /api/student/offers/<id>/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.client.force_authenticate(user=self.student)

    def test_get_open_offer_detail(self):
        res = self.client.get(offer_detail_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], self.offer.title)

    def test_get_closed_offer_returns_404(self):
        closed = create_offer(
            self.company,
            title='Closed',
            status=InternshipOffer.Status.CLOSED,
        )
        res = self.client.get(offer_detail_url(closed.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_nonexistent_offer_returns_404(self):
        res = self.client.get(offer_detail_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ── Apply to Offer ────────────────────────────────────────────────────

class ApplyToOfferTests(TestCase):
    """POST /api/student/offers/<id>/apply/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.client.force_authenticate(user=self.student)

    def test_apply_to_offer_success(self):
        res = self.client.post(apply_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('application_id', res.data)
        self.assertEqual(res.data['status'], Internship.Status.PENDING)

    def test_apply_creates_internship_record(self):
        self.client.post(apply_url(self.offer.id))
        self.assertTrue(
            Internship.objects.filter(
                student=self.student, offer=self.offer,
            ).exists()
        )

    def test_apply_twice_fails(self):
        self.client.post(apply_url(self.offer.id))
        res = self.client.post(apply_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already applied', res.data['detail'])

    def test_apply_to_closed_offer_returns_404(self):
        closed = create_offer(
            self.company,
            title='Closed',
            status=InternshipOffer.Status.CLOSED,
        )
        res = self.client.post(apply_url(closed.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_company_cannot_apply(self):
        self.client.force_authenticate(user=self.company)
        res = self.client.post(apply_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_apply(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(apply_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Application List ──────────────────────────────────────────────────

class ApplicationListTests(TestCase):
    """GET /api/student/applications/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.client.force_authenticate(user=self.student)

    def test_list_applications_empty(self):
        res = self.client.get(APPLICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_list_my_applications(self):
        create_internship(self.student, self.company, self.offer)
        res = self.client.get(APPLICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_student_only_sees_own_applications(self):
        other_student = create_student(
            self.university, email='other@test.com',
        )
        create_internship(other_student, self.company, self.offer)
        res = self.client.get(APPLICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_unauthenticated_cannot_list_applications(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(APPLICATION_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Application Detail ────────────────────────────────────────────────

class ApplicationDetailTests(TestCase):
    """GET /api/student/applications/<id>/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.internship = create_internship(self.student, self.company, self.offer)
        self.client.force_authenticate(user=self.student)

    def test_get_application_detail(self):
        res = self.client.get(application_detail_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['subject'], self.internship.subject)

    def test_get_nonexistent_application_returns_404(self):
        res = self.client.get(application_detail_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_see_another_students_application(self):
        other_student = create_student(
            self.university, email='other@test.com',
        )
        self.client.force_authenticate(user=other_student)
        res = self.client.get(application_detail_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ── Download Agreement ────────────────────────────────────────────────

class DownloadAgreementTests(TestCase):
    """GET /api/student/applications/<id>/document/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.client.force_authenticate(user=self.student)

    def test_download_agreement_for_validated_internship(self):
        internship = create_internship(
            self.student, self.company, self.offer,
            status=Internship.Status.VALIDATED,
        )
        agreement = InternshipAgreement.objects.create(internship=internship)
        agreement.pdf_file.save(
            'agreement.pdf',
            ContentFile(b'%PDF-1.4 test'),
            save=True,
        )

        res = self.client.get(application_document_url(internship.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')

    def test_download_agreement_not_validated_returns_403(self):
        internship = create_internship(
            self.student, self.company, self.offer,
            status=Internship.Status.PENDING,
        )
        res = self.client.get(application_document_url(internship.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_download_agreement_validated_but_no_pdf_returns_404(self):
        internship = create_internship(
            self.student, self.company, self.offer,
            status=Internship.Status.VALIDATED,
        )
        res = self.client.get(application_document_url(internship.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_download_agreement_nonexistent_application_returns_404(self):
        res = self.client.get(application_document_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ── Document List ─────────────────────────────────────────────────────

class StudentDocumentListTests(TestCase):
    """GET /api/student/documents/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.company = create_company()
        self.offer1 = create_offer(self.company, title='Offer 1')
        self.offer2 = create_offer(self.company, title='Offer 2')
        self.client.force_authenticate(user=self.student)

    def test_list_documents_success(self):
        internship1 = create_internship(
            self.student, self.company, self.offer1,
            status=Internship.Status.VALIDATED,
        )
        agreement1 = InternshipAgreement.objects.create(internship=internship1)
        
        internship2 = create_internship(
            self.student, self.company, self.offer2,
            status=Internship.Status.VALIDATED,
        )
        agreement2 = InternshipAgreement.objects.create(internship=internship2)

        res = self.client.get(DOCUMENT_LIST_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        # Should be ordered by -generated_at (which is auto_now_add, so latest first)
        self.assertEqual(res.data[0]['id'], agreement2.id)
        self.assertEqual(res.data[1]['id'], agreement1.id)
        self.assertEqual(res.data[0]['offer_title'], 'Offer 2')
        self.assertEqual(res.data[1]['offer_title'], 'Offer 1')

    def test_list_documents_only_own_documents(self):
        other_student = create_student(self.university, email='other@test.com')
        other_internship = create_internship(
            other_student, self.company, self.offer1,
            status=Internship.Status.VALIDATED,
        )
        InternshipAgreement.objects.create(internship=other_internship)

        my_internship = create_internship(
            self.student, self.company, self.offer2,
            status=Internship.Status.VALIDATED,
        )
        my_agreement = InternshipAgreement.objects.create(internship=my_internship)

        res = self.client.get(DOCUMENT_LIST_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], my_agreement.id)


# ── Digital CV ────────────────────────────────────────────────────────

class DigitalCVTests(TestCase):
    """GET and PATCH /api/student/me/cv/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(
            self.university,
            full_name='CV Student',
            academic_year=Student.AcademicYear.YEAR_3,
            professional_summary='Passionate dev.',
            github_link='https://github.com/cv',
        )
        self.client.force_authenticate(user=self.student)

    def test_get_digital_cv(self):
        res = self.client.get(DIGITAL_CV_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['full_name'], 'CV Student')
        self.assertEqual(res.data['academic_year'], 'year_3')
        self.assertEqual(res.data['professional_summary'], 'Passionate dev.')
        self.assertEqual(res.data['github_link'], 'https://github.com/cv')
        self.assertEqual(res.data['university']['name'], self.university.name)
        self.assertEqual(res.data['skills'], [])

    def test_patch_digital_cv(self):
        """Can update academic/professional fields but NOT university."""
        payload = {
            'academic_year': 'year_5',
            'professional_summary': 'Updated bio.',
            'github_link': 'https://github.com/newcv',
            'portfolio_link': 'https://portfolio.com',
        }
        res = self.client.patch(DIGITAL_CV_URL, payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.student.refresh_from_db()
        self.assertEqual(self.student.academic_year, 'year_5')
        self.assertEqual(self.student.professional_summary, 'Updated bio.')
        self.assertEqual(self.student.github_link, 'https://github.com/newcv')
        self.assertEqual(self.student.portfolio_link, 'https://portfolio.com')
        # University should remain unchanged
        self.assertEqual(self.student.university.id, self.university.id)

    def test_patch_digital_cv_cannot_change_university(self):
        """Ensure university_id is ignored (no longer a writable field)."""
        new_university = create_university(name='New Univ', code='NU', email_domain='test-nu.dz')
        res = self.client.patch(DIGITAL_CV_URL, {'university_id': new_university.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        # University should NOT have changed
        self.assertEqual(self.student.university.id, self.university.id)

    def test_patch_digital_cv_ignores_personal_info(self):
        """Ensure full_name cannot be changed via CV endpoint."""
        res = self.client.patch(DIGITAL_CV_URL, {'full_name': 'Hacked Name'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.full_name, 'CV Student')
