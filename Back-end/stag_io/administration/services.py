"""Services for administration workflows."""
import base64

from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone

from core.models import Admin, Internship, InternshipAgreement


def _get_university_logo_base64(university):
    """Return university logo content encoded as base64."""
    if not university.logo:
        return ''

    with university.logo.open('rb') as logo_file:
        return base64.b64encode(logo_file.read()).decode('utf-8')


def _format_duration(start_date, end_date):
    """Return a readable internship duration."""
    delta = end_date - start_date
    days = delta.days

    if days <= 0:
        return 'Same day'
    if days == 1:
        return '1 day'
    if days < 30:
        return f'{days} days'

    months = days // 30
    remaining_days = days % 30
    if remaining_days == 0:
        month_label = 'month' if months == 1 else 'months'
        return f'{months} {month_label}'

    month_label = 'month' if months == 1 else 'months'
    day_label = 'day' if remaining_days == 1 else 'days'
    return f'{months} {month_label} and {remaining_days} {day_label}'


def _build_academic_year(date_value):
    """Return academic year from a date."""
    if date_value.month >= 9:
        return f'{date_value.year}/{date_value.year + 1}'
    return f'{date_value.year - 1}/{date_value.year}'


def generate_internship_agreement(internship, admin=None):
    """Render the internship agreement template, generate a PDF, and save it."""
    if not isinstance(internship, Internship):
        raise ValueError('A valid Internship instance is required.')

    internship = Internship.objects.select_related(
        'student',
        'student__university',
        'company',
    ).get(pk=internship.pk)

    if internship.student.university is None:
        raise ValueError('The internship student must belong to a university.')

    if admin is None:
        admin = Admin.objects.filter(
            university=internship.student.university,
        ).order_by('id').first()

    if admin is None:
        raise ValueError('No administrator found for this university.')

    generated_date = timezone.now()
    context = {
        'internship': internship,
        'admin': admin,
        'reference_number': f'CS-{internship.id}/{generated_date.year}',
        'academic_year': _build_academic_year(internship.start_date),
        'duration': _format_duration(internship.start_date, internship.end_date),
        'generated_date': generated_date,
        'university_logo_base64': _get_university_logo_base64(
            internship.student.university,
        ),
    }

    html_string = render_to_string(
        'administration/convention_template.html',
        context,
    )
    from weasyprint import HTML
    pdf_bytes = HTML(string=html_string, base_url=str(settings.MEDIA_ROOT)).write_pdf()

    agreement, _ = InternshipAgreement.objects.get_or_create(internship=internship)
    if agreement.pdf_file:
        agreement.pdf_file.delete(save=False)

    agreement.pdf_file.save(
        f'internship_agreement_{internship.id}.pdf',
        ContentFile(pdf_bytes),
        save=False,
    )
    agreement.save()

    return agreement
