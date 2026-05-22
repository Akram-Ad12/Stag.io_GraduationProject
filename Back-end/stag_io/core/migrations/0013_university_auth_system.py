# Migration: New university-based authentication system
# - Adds email_domain to University
# - Makes Student.university required (non-nullable)
# - Makes Admin.university required (non-nullable)

from django.db import migrations, models
import django.db.models.deletion


def seed_universities(apps, schema_editor):
    """Create the 5 predefined universities."""
    University = apps.get_model('core', 'University')
    universities = [
        {
            'code': 'UC1',
            'name': 'University Constantine 1 Mentouri',
            'email_domain': 'univ-constantine1.dz',
            'wilaya': '25 - Constantine',
        },
        {
            'code': 'UC2',
            'name': 'University Constantine 2 Abdelhamid Mehri',
            'email_domain': 'univ-constantine2.dz',
            'wilaya': '25 - Constantine',
        },
        {
            'code': 'UC3',
            'name': 'University Constantine 3 Salah Boubnider',
            'email_domain': 'univ-constantine3.dz',
            'wilaya': '25 - Constantine',
        },
        {
            'code': 'US1',
            'name': 'University Setif 1 Ferhat Abbas',
            'email_domain': 'univ-setif1.dz',
            'wilaya': '19 - Sétif',
        },
        {
            'code': 'USTHB',
            'name': 'University Alger USTHB',
            'email_domain': 'univ-usthb.dz',
            'wilaya': '16 - Alger',
        },
    ]
    for uni in universities:
        University.objects.get_or_create(code=uni['code'], defaults=uni)


def assign_default_university(apps, schema_editor):
    """
    Assign the first university to any Student/Admin that has
    university=NULL so the NOT NULL constraint can be applied.
    """
    University = apps.get_model('core', 'University')
    Student = apps.get_model('core', 'Student')
    Admin = apps.get_model('core', 'Admin')

    default_uni = University.objects.order_by('id').first()
    if default_uni:
        Student.objects.filter(university__isnull=True).update(
            university=default_uni,
        )
        Admin.objects.filter(university__isnull=True).update(
            university=default_uni,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_add_digital_cv_fields'),
    ]

    operations = [
        # 1. Add email_domain field (nullable for test compatibility)
        migrations.AddField(
            model_name='university',
            name='email_domain',
            field=models.CharField(
                blank=True,
                null=True,
                default=None,
                help_text='Email domain suffix for this university (e.g. univ-constantine1.dz).',
                max_length=100,
            ),
            preserve_default=False,
        ),

        # 2. Assign default university to orphaned students/admins
        migrations.RunPython(
            assign_default_university,
            migrations.RunPython.noop,
        ),

        # 3. Now make email_domain unique (NULLs don't violate unique in PostgreSQL)
        migrations.AlterField(
            model_name='university',
            name='email_domain',
            field=models.CharField(
                blank=True,
                null=True,
                help_text='Email domain suffix for this university (e.g. univ-constantine1.dz).',
                max_length=100,
                unique=True,
            ),
        ),

        # 5. Make Student.university required (NOT NULL)
        migrations.AlterField(
            model_name='student',
            name='university',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='students',
                to='core.university',
            ),
        ),

        # 6. Make Admin.university required (NOT NULL)
        migrations.AlterField(
            model_name='admin',
            name='university',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='admins',
                to='core.university',
            ),
        ),
    ]
