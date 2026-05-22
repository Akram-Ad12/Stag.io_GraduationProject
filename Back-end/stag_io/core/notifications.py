"""
Centralized notification service.
All notification creation goes through here so the logic
is in one place and easy to maintain.
"""
from core.models import Notification, Admin


def notify(recipient, internship, notification_type, message, link=''):
    """
    Create a single notification.
    recipient = any User instance (Student, Company, or Admin)
    """
    Notification.objects.create(
        recipient=recipient,
        internship=internship,
        notification_type=notification_type,
        message=message,
        link=link,
    )


# ── Student notifications ────────────────────────────────────────────

def notify_student_application_submitted(internship):
    """Sent to student right after they apply."""
    notify(
        recipient=internship.student,
        internship=internship,
        notification_type=Notification.Type.APPLICATION_SUBMITTED,
        message=(
            f'Your application to "{internship.subject}" at '
            f'{internship.company.name} has been submitted successfully. '
            f'You will be notified when the company reviews your application.'
        ),
        link=f'/applications/{internship.id}/',
    )


def notify_student_accepted(internship):
    """Sent to student when company accepts them."""
    notify(
        recipient=internship.student,
        internship=internship,
        notification_type=Notification.Type.APPLICATION_ACCEPTED,
        message=(
            f'Congratulations! {internship.company.name} has accepted '
            f'your application for "{internship.subject}". '
            f'The university will now review and validate your internship.'
        ),
        link=f'/applications/{internship.id}/',
    )


def notify_student_rejected(internship):
    """Sent to student when company rejects them."""
    notify(
        recipient=internship.student,
        internship=internship,
        notification_type=Notification.Type.APPLICATION_REJECTED,
        message=(
            f'{internship.company.name} did not select your application '
            f'for "{internship.subject}". '
            f'Keep applying — other opportunities are waiting!'
        ),
        link=f'/applications/{internship.id}/',
    )


def notify_student_validated(internship):
    """Sent to student when admin validates — agreement is ready."""
    notify(
        recipient=internship.student,
        internship=internship,
        notification_type=Notification.Type.INTERNSHIP_VALIDATED,
        message=(
            f'Your internship at {internship.company.name} has been '
            f'officially validated by the university! '
            f'Your internship agreement is now ready to download.'
        ),
        link=f'/applications/{internship.id}/document/',
    )


# ── Company notifications ────────────────────────────────────────────

def notify_company_new_applicant(internship):
    """Sent to company when a student applies to their offer."""
    notify(
        recipient=internship.company,
        internship=internship,
        notification_type=Notification.Type.NEW_APPLICANT,
        message=(
            f'{internship.student.full_name} has applied to your offer '
            f'"{internship.subject}". '
            f'Review their profile and decide to accept or reject.'
        ),
        link=f'/offers/{internship.offer_id}/applicants/',
    )


def notify_company_agreement_ready(internship):
    """Sent to company when admin validates — agreement is ready."""
    notify(
        recipient=internship.company,
        internship=internship,
        notification_type=Notification.Type.AGREEMENT_READY,
        message=(
            f'The internship agreement for {internship.student.full_name} '
            f'has been validated by the university and is now ready. '
            f'The student can download their official agreement.'
        ),
        link=f'/internships/{internship.id}/agreement/',
    )


def notify_company_admin_rejected(internship):
    """Sent to company when admin rejects the internship."""
    notify(
        recipient=internship.company,
        internship=internship,
        notification_type=Notification.Type.ADMIN_REJECTED,
        message=(
            f'The internship request for {internship.student.full_name} '
            f'for "{internship.subject}" was rejected by the university.'
        ),
        link=f'/offers/{internship.offer_id}/applicants/',
    )


# ── Admin notifications ──────────────────────────────────────────────

def notify_admins_internship_accepted(internship):
    """
    Sent to ALL admins of the student's university
    when a company accepts a student.
    Replaces the old inline notification logic in company/views.py.
    """
    university = internship.student.university
    if not university:
        return

    admins = Admin.objects.filter(university=university)
    for admin in admins:
        notify(
            recipient=admin,
            internship=internship,
            notification_type=Notification.Type.INTERNSHIP_ACCEPTED,
            message=(
                f'{internship.student.full_name} has been accepted by '
                f'{internship.company.name} for "{internship.subject}". '
                f'Please review and validate or reject this internship.'
            ),
            link=f'/administration/internships/{internship.id}/',
        )