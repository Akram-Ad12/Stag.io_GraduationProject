"""
Django command to close internship offers whose start date has arrived.
Offers are not deleted — their status is set to 'closed' so they no
longer appear to students.
"""
from datetime import date

from django.core.management.base import BaseCommand

from core.models import InternshipOffer


class Command(BaseCommand):
    """Django command to auto-close expired internship offers."""

    help = 'Close all open internship offers whose start_date <= today.'

    def handle(self, *args, **options):
        """Entrypoint for command."""
        today = date.today()
        expired = InternshipOffer.objects.filter(
            status=InternshipOffer.Status.OPEN,
            start_date__lte=today,
        )
        count = expired.update(status=InternshipOffer.Status.CLOSED)

        if count:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Closed {count} expired offer{"s" if count != 1 else ""}.'
                )
            )
        else:
            self.stdout.write('No expired offers found.')
