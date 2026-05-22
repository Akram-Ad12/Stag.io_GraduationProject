"""
Management command to seed the 5 predefined universities and their admin accounts.

Run:  python manage.py seed_universities
Safe to run multiple times — uses get_or_create so nothing is duplicated.
"""
from django.core.management.base import BaseCommand

from core.models import University, Admin

# ── Predefined data ──────────────────────────────────────────────────
UNIVERSITIES = [
    {
        'code': 'UC1',
        'name': 'University Constantine 1 Mentouri',
        'email_domain': 'univ-constantine1.dz',
        'wilaya': '25 - Constantine',
        'admin_email': 'admin@univ-constantine1.dz',
        'admin_department': 'Internship Office',
        'admin_title': 'University Administrator',
    },
    {
        'code': 'UC2',
        'name': 'University Constantine 2 Abdelhamid Mehri',
        'email_domain': 'univ-constantine2.dz',
        'wilaya': '25 - Constantine',
        'admin_email': 'admin@univ-constantine2.dz',
        'admin_department': 'Internship Office',
        'admin_title': 'University Administrator',
    },
    {
        'code': 'UC3',
        'name': 'University Constantine 3 Salah Boubnider',
        'email_domain': 'univ-constantine3.dz',
        'wilaya': '25 - Constantine',
        'admin_email': 'admin@univ-constantine3.dz',
        'admin_department': 'Internship Office',
        'admin_title': 'University Administrator',
    },
    {
        'code': 'US1',
        'name': 'University Setif 1 Ferhat Abbas',
        'email_domain': 'univ-setif1.dz',
        'wilaya': '19 - Sétif',
        'admin_email': 'admin@univ-setif1.dz',
        'admin_department': 'Internship Office',
        'admin_title': 'University Administrator',
    },
    {
        'code': 'USTHB',
        'name': 'University Alger USTHB',
        'email_domain': 'univ-usthb.dz',
        'wilaya': '16 - Alger',
        'admin_email': 'admin@univ-usthb.dz',
        'admin_department': 'Internship Office',
        'admin_title': 'University Administrator',
    },
]

DEFAULT_ADMIN_PASSWORD = 'admin12345'


class Command(BaseCommand):
    help = 'Seed the 5 predefined universities and their admin accounts.'

    def handle(self, *args, **options):
        for uni_data in UNIVERSITIES:
            # 1. Create or retrieve the university
            university, created = University.objects.get_or_create(
                code=uni_data['code'],
                defaults={
                    'name': uni_data['name'],
                    'email_domain': uni_data['email_domain'],
                    'wilaya': uni_data['wilaya'],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ Created university: {university.name}'
                ))
            else:
                # Update email_domain in case it was missing
                if not university.email_domain:
                    university.email_domain = uni_data['email_domain']
                    university.save(update_fields=['email_domain'])
                self.stdout.write(self.style.WARNING(
                    f'  – University already exists: {university.name}'
                ))

            # 2. Create or retrieve the admin account
            admin_email = uni_data['admin_email']
            if not Admin.objects.filter(email=admin_email).exists():
                admin = Admin(
                    email=admin_email,
                    university=university,
                    department=uni_data['admin_department'],
                    title=uni_data['admin_title'],
                    is_staff=True,
                )
                admin.set_password(DEFAULT_ADMIN_PASSWORD)
                admin.save()
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ Created admin: {admin_email}  '
                    f'(password: {DEFAULT_ADMIN_PASSWORD})'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'  – Admin already exists: {admin_email}'
                ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            'Done! All 5 universities and admin accounts are ready.'
        ))
