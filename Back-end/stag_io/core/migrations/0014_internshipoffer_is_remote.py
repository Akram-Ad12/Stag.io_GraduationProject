# Migration: Add is_remote field to InternshipOffer

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_university_auth_system'),
    ]

    operations = [
        migrations.AddField(
            model_name='internshipoffer',
            name='is_remote',
            field=models.BooleanField(
                default=False,
                help_text='If True, this is a remote/online internship (no location or wilaya).',
            ),
        ),
    ]
