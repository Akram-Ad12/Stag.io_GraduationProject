"""Tests for the company API endpoints (offers, applicants)."""
from datetime import date

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    University, Student, Company, Internship, InternshipOffer,
)


# ── URL helpers ───────────────────────────────────────────────────────

OFFER_LIST_CREATE_URL = reverse('company:offer-list-create')
ALL_APPLICATIONS_URL = reverse('company:all-applications')



def offer_detail_url(offer_id):
    return reverse('company:offer-detail', args=[offer_id])


def offer_applicants_url(offer_id):
    return reverse('company:offer-applicants', args=[offer_id])


def application_accept_url(app_id):
    return reverse('company:application-accept', args=[app_id])


def application_reject_url(app_id):
    return reverse('company:application-reject', args=[app_id])


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


# ── Offer List / Create ───────────────────────────────────────────────

class PublicOfferTests(TestCase):
    """Unauthenticated access is denied."""

    def setUp(self):
        self.client = APIClient()

    def test_list_offers_requires_auth(self):
        res = self.client.get(OFFER_LIST_CREATE_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_offer_requires_auth(self):
        res = self.client.post(OFFER_LIST_CREATE_URL, {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class StudentCannotAccessCompanyOfferTests(TestCase):
    """Students are forbidden from company offer management endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.student = create_student(self.university)
        self.client.force_authenticate(user=self.student)

    def test_student_cannot_list_company_offers(self):
        res = self.client.get(OFFER_LIST_CREATE_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_create_offer(self):
        res = self.client.post(OFFER_LIST_CREATE_URL, {})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class OfferListCreateTests(TestCase):
    """GET and POST /api/company/offers/."""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.client.force_authenticate(user=self.company)

    def test_list_own_offers_empty(self):
        res = self.client.get(OFFER_LIST_CREATE_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_list_own_offers(self):
        create_offer(self.company)
        create_offer(self.company, title='Second Offer')
        res = self.client.get(OFFER_LIST_CREATE_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_company_only_sees_own_offers(self):
        other_company = create_company(email='other@test.com', name='Other Corp')
        create_offer(other_company, title='Other Offer')
        create_offer(self.company, title='My Offer')

        res = self.client.get(OFFER_LIST_CREATE_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'My Offer')

    def test_create_offer_success(self):
        payload = {
            'title': 'New Offer',
            'description': 'Build great things.',
            'location': '16 - Alger',
            'wilaya': '16 - Alger',
            'type': 'unpaid',
            'start_date': '2026-07-01',
            'end_date': '2026-09-30',
        }
        res = self.client.post(OFFER_LIST_CREATE_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            InternshipOffer.objects.filter(
                company=self.company, title='New Offer',
            ).exists()
        )

    def test_create_offer_missing_required_field_fails(self):
        payload = {
            'description': 'Missing title field.',
            'location': '16 - Alger',
            'type': 'unpaid',
            'start_date': '2026-07-01',
            'end_date': '2026-09-30',
        }
        res = self.client.post(OFFER_LIST_CREATE_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── Offer Detail / Update / Delete ────────────────────────────────────

class OfferDetailTests(TestCase):
    """GET, PATCH, DELETE /api/company/offers/<id>/."""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.client.force_authenticate(user=self.company)

    def test_get_offer_detail(self):
        res = self.client.get(offer_detail_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], self.offer.title)

    def test_get_other_companys_offer_returns_404(self):
        other_company = create_company(email='other@test.com', name='Other')
        other_offer = create_offer(other_company, title='Other Offer')
        res = self.client.get(offer_detail_url(other_offer.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_offer_title(self):
        res = self.client.patch(
            offer_detail_url(self.offer.id),
            {'title': 'Updated Title'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.offer.refresh_from_db()
        self.assertEqual(self.offer.title, 'Updated Title')

    def test_patch_offer_close_status(self):
        res = self.client.patch(
            offer_detail_url(self.offer.id),
            {'status': 'closed'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.offer.refresh_from_db()
        self.assertEqual(self.offer.status, InternshipOffer.Status.CLOSED)

    def test_delete_offer_success(self):
        res = self.client.delete(offer_detail_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(InternshipOffer.objects.filter(pk=self.offer.id).exists())

    def test_delete_other_companys_offer_returns_404(self):
        other_company = create_company(email='other@test.com', name='Other')
        other_offer = create_offer(other_company, title='Other Offer')
        res = self.client.delete(offer_detail_url(other_offer.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_nonexistent_offer_returns_404(self):
        res = self.client.patch(
            offer_detail_url(99999), {'title': 'x'}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ── Offer Applicants ──────────────────────────────────────────────────

class OfferApplicantListTests(TestCase):
    """GET /api/company/offers/<id>/applicants/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.student1 = create_student(self.university, email='s1@test.com')
        self.student2 = create_student(self.university, email='s2@test.com', full_name='S2')
        self.client.force_authenticate(user=self.company)

    def test_list_applicants_for_own_offer(self):
        create_internship(self.student1, self.company, self.offer)
        create_internship(self.student2, self.company, self.offer)
        res = self.client.get(offer_applicants_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_list_applicants_empty(self):
        res = self.client.get(offer_applicants_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_applicants_for_other_companys_offer_returns_empty(self):
        """Returns empty (not 404) for an offer that does not belong to us."""
        other_company = create_company(email='other@test.com', name='Other')
        other_offer = create_offer(other_company, title='Other Offer')
        create_internship(self.student1, other_company, other_offer)
        res = self.client.get(offer_applicants_url(other_offer.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_student_cannot_list_applicants(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.get(offer_applicants_url(self.offer.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class AllApplicantsListTests(TestCase):
    """GET /api/company/applications/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.company = create_company()
        self.student1 = create_student(self.university, email='s1@test.com')
        self.student2 = create_student(self.university, email='s2@test.com', full_name='S2')
        self.offer1 = create_offer(self.company, title='Offer 1')
        self.offer2 = create_offer(self.company, title='Offer 2')
        self.client.force_authenticate(user=self.company)

    def test_list_all_applicants_success(self):
        create_internship(self.student1, self.company, self.offer1)
        create_internship(self.student2, self.company, self.offer2)

        res = self.client.get(ALL_APPLICATIONS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_list_all_applicants_empty(self):
        res = self.client.get(ALL_APPLICATIONS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_only_see_applications_for_own_company(self):
        other_company = create_company(email='other@test.com', name='Other')
        other_offer = create_offer(other_company)
        create_internship(self.student1, other_company, other_offer)

        create_internship(self.student2, self.company, self.offer1)

        res = self.client.get(ALL_APPLICATIONS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_student_cannot_access_all_applicants(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.get(ALL_APPLICATIONS_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)



# ── Accept Applicant ──────────────────────────────────────────────────

class AcceptApplicantTests(TestCase):
    """POST /api/company/applications/<id>/accept/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.student = create_student(self.university)
        self.internship = create_internship(
            self.student, self.company, self.offer,
            status=Internship.Status.PENDING,
        )
        self.client.force_authenticate(user=self.company)

    def test_accept_pending_application_success(self):
        res = self.client.post(application_accept_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.internship.refresh_from_db()
        self.assertEqual(
            self.internship.status, Internship.Status.ACCEPTED_BY_COMPANY,
        )
        self.assertIn('application_id', res.data)

    def test_accept_already_accepted_returns_400(self):
        self.internship.status = Internship.Status.ACCEPTED_BY_COMPANY
        self.internship.save()
        res = self.client.post(application_accept_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_validated_application_returns_400(self):
        self.internship.status = Internship.Status.VALIDATED
        self.internship.save()
        res = self.client.post(application_accept_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_other_companys_application_returns_404(self):
        other_company = create_company(email='other@test.com', name='Other')
        other_offer = create_offer(other_company, title='Other Offer')
        other_internship = create_internship(
            self.student, other_company, other_offer,
        )
        res = self.client.post(application_accept_url(other_internship.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_accept_nonexistent_application_returns_404(self):
        res = self.client.post(application_accept_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_accept_application(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(application_accept_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_accept_application(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(application_accept_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Reject Applicant ──────────────────────────────────────────────────

class RejectApplicantTests(TestCase):
    """POST /api/company/applications/<id>/reject/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.student = create_student(self.university)
        self.internship = create_internship(
            self.student, self.company, self.offer,
            status=Internship.Status.PENDING,
        )
        self.client.force_authenticate(user=self.company)

    def test_reject_pending_application_success(self):
        res = self.client.post(application_reject_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.internship.refresh_from_db()
        self.assertEqual(self.internship.status, Internship.Status.REJECTED)

    def test_reject_already_rejected_returns_400(self):
        self.internship.status = Internship.Status.REJECTED
        self.internship.save()
        res = self.client.post(application_reject_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_validated_application_returns_400(self):
        self.internship.status = Internship.Status.VALIDATED
        self.internship.save()
        res = self.client.post(application_reject_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_other_companys_application_returns_404(self):
        other_company = create_company(email='other@test.com', name='Other')
        other_offer = create_offer(other_company, title='Other Offer')
        other_internship = create_internship(
            self.student, other_company, other_offer,
        )
        res = self.client.post(application_reject_url(other_internship.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_reject_nonexistent_application_returns_404(self):
        res = self.client.post(application_reject_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_reject_application(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(application_reject_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_reject_application(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(application_reject_url(self.internship.id))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Download Agreement ────────────────────────────────────────────────

class DownloadAgreementTests(TestCase):
    """GET /api/company/applications/<id>/document/."""

    def setUp(self):
        self.client = APIClient()
        self.university = create_university()
        self.company = create_company()
        self.offer = create_offer(self.company)
        self.student = create_student(self.university)
        self.internship = create_internship(
            self.student, self.company, self.offer,
            status=Internship.Status.VALIDATED,
        )
        self.client.force_authenticate(user=self.company)

    def test_download_agreement_for_validated_internship(self):
        from core.models import InternshipAgreement
        from django.core.files.base import ContentFile

        agreement = InternshipAgreement.objects.create(internship=self.internship)
        agreement.pdf_file.save(
            'agreement.pdf',
            ContentFile(b'PDF content'),
        )

        url = reverse('company:application-document', args=[self.internship.id])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertEqual(
            res['Content-Disposition'],
            f'attachment; filename="internship_agreement_{self.internship.id}.pdf"'
        )
        self.assertEqual(b''.join(res.streaming_content), b'PDF content')

    def test_download_agreement_not_validated_returns_403(self):
        self.internship.status = Internship.Status.ACCEPTED_BY_COMPANY
        self.internship.save()

        url = reverse('company:application-document', args=[self.internship.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_download_agreement_validated_but_no_pdf_returns_404(self):
        url = reverse('company:application-document', args=[self.internship.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_download_agreement_other_company_returns_404(self):
        other_company = create_company(email='other@test.com', name='Other')
        other_offer = create_offer(other_company, title='Other Offer')
        other_internship = create_internship(
            self.student, other_company, other_offer,
            status=Internship.Status.VALIDATED,
        )

        from core.models import InternshipAgreement
        from django.core.files.base import ContentFile
        agreement = InternshipAgreement.objects.create(internship=other_internship)
        agreement.pdf_file.save(
            'agreement.pdf',
            ContentFile(b'PDF content'),
        )

        url = reverse('company:application-document', args=[other_internship.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_download_agreement_from_company_endpoint(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('company:application-document', args=[self.internship.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

