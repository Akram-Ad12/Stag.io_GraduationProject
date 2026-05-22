"""Database models."""
import os
import uuid

from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)

# ── Predefined university email domains ─────────────────────────────
# Maps email domain → university code. Used for student registration
# validation and automatic university assignment.
UNIVERSITY_EMAIL_DOMAINS = {
    'univ-constantine1.dz': 'UC1',
    'univ-constantine2.dz': 'UC2',
    'univ-constantine3.dz': 'UC3',
    'univ-setif1.dz': 'US1',
    'univ-usthb.dz': 'USTHB',
}

ALGERIAN_WILAYAS = [
    ('01 - Adrar', '01 - Adrar'), ('02 - Chlef', '02 - Chlef'),
    ('03 - Laghouat', '03 - Laghouat'), ('04 - Oum El Bouaghi', '04 - Oum El Bouaghi'),
    ('05 - Batna', '05 - Batna'), ('06 - Béjaïa', '06 - Béjaïa'),
    ('07 - Biskra', '07 - Biskra'), ('08 - Béchar', '08 - Béchar'),
    ('09 - Blida', '09 - Blida'), ('10 - Bouira', '10 - Bouira'),
    ('11 - Tamanrasset', '11 - Tamanrasset'), ('12 - Tébessa', '12 - Tébessa'),
    ('13 - Tlemcen', '13 - Tlemcen'), ('14 - Tiaret', '14 - Tiaret'),
    ('15 - Tizi Ouzou', '15 - Tizi Ouzou'), ('16 - Alger', '16 - Alger'),
    ('17 - Djelfa', '17 - Djelfa'), ('18 - Jijel', '18 - Jijel'),
    ('19 - Sétif', '19 - Sétif'), ('20 - Saïda', '20 - Saïda'),
    ('21 - Skikda', '21 - Skikda'), ('22 - Sidi Bel Abbès', '22 - Sidi Bel Abbès'),
    ('23 - Annaba', '23 - Annaba'), ('24 - Guelma', '24 - Guelma'),
    ('25 - Constantine', '25 - Constantine'), ('26 - Médéa', '26 - Médéa'),
    ('27 - Mostaganem', '27 - Mostaganem'), ('28 - M\'Sila', '28 - M\'Sila'),
    ('29 - Mascara', '29 - Mascara'), ('30 - Ouargla', '30 - Ouargla'),
    ('31 - Oran', '31 - Oran'), ('32 - El Bayadh', '32 - El Bayadh'),
    ('33 - Illizi', '33 - Illizi'), ('34 - Bordj Bou Arréridj', '34 - Bordj Bou Arréridj'),
    ('35 - Boumerdès', '35 - Boumerdès'), ('36 - El Tarf', '36 - El Tarf'),
    ('37 - Tindouf', '37 - Tindouf'), ('38 - Tissemsilt', '38 - Tissemsilt'),
    ('39 - El Oued', '39 - El Oued'), ('40 - Khenchela', '40 - Khenchela'),
    ('41 - Souk Ahras', '41 - Souk Ahras'), ('42 - Tipaza', '42 - Tipaza'),
    ('43 - Mila', '43 - Mila'), ('44 - Aïn Defla', '44 - Aïn Defla'),
    ('45 - Naâma', '45 - Naâma'), ('46 - Aïn Témouchent', '46 - Aïn Témouchent'),
    ('47 - Ghardaïa', '47 - Ghardaïa'), ('48 - Relizane', '48 - Relizane'),
    ('49 - El M\'Ghair', '49 - El M\'Ghair'), ('50 - El Menia', '50 - El Menia'),
    ('51 - Ouled Djellal', '51 - Ouled Djellal'), ('52 - Bordj Badji Mokhtar', '52 - Bordj Badji Mokhtar'),
    ('53 - Béni Abbès', '53 - Béni Abbès'), ('54 - Timimoun', '54 - Timimoun'),
    ('55 - Touggourt', '55 - Touggourt'), ('56 - Djanet', '56 - Djanet'),
    ('57 - In Salah', '57 - In Salah'), ('58 - In Guezzam', '58 - In Guezzam'),
]


def logo_image_file_path(instance, filename):
    """Generate file path for new logo image."""
    ext = os.path.splitext(filename)[1]
    filename = f'{uuid.uuid4()}{ext}'
    return os.path.join('uploads', 'logo', filename)


def profile_image_file_path(instance, filename):
    """Generate file path for new student profile image."""
    ext = os.path.splitext(filename)[1]
    filename = f'{uuid.uuid4()}{ext}'
    return os.path.join('uploads', 'profile', filename)


def university_logo_file_path(instance, filename):
    """Generate file path for new university logo image."""
    ext = os.path.splitext(filename)[1]
    filename = f'{uuid.uuid4()}{ext}'
    return os.path.join('uploads', 'university', filename)


def agreement_file_path(instance, filename):
    """Generate file path for internship agreement PDF."""
    filename = f'{uuid.uuid4()}.pdf'
    return os.path.join('uploads', 'agreements', filename)


class University(models.Model):
    """Represents a university institution."""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    email_domain = models.CharField(
        max_length=100, unique=True, blank=True, null=True,
        help_text='Email domain suffix for this university (e.g. univ-constantine1.dz).',
    )
    wilaya = models.CharField(max_length=100, choices=ALGERIAN_WILAYAS)
    address = models.TextField(blank=True)
    logo = models.ImageField(
        null=True, blank=True, upload_to=university_logo_file_path,
    )

    class Meta:
        verbose_name = 'University'
        verbose_name_plural = 'Universities'

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    """Manager for users."""

    def create_user(self, email, password=None, **extra_fields):
        """Create, save and return a new user."""
        if not email:
            raise ValueError('User must have an email address.')

        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a Django superuser (system administrator)."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Roles.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Base user model for the platform."""

    class Roles(models.TextChoices):
        STUDENT = 'student', 'Student'
        COMPANY = 'company', 'Company'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(max_length=255, unique=True)
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'

    def __str__(self):
        return self.email


class Student(User):
    """Student user — inherits all User fields directly."""

    class AcademicYear(models.TextChoices):
        YEAR_1 = 'year_1', 'Year 1 (License 1)'
        YEAR_2 = 'year_2', 'Year 2 (License 2)'
        YEAR_3 = 'year_3', 'Year 3 (License 3)'
        YEAR_4 = 'year_4', 'Year 4 (Master 1)'
        YEAR_5 = 'year_5', 'Year 5 (Master 2)'
        DOCTORATE = 'doctorate', 'Doctorate'

    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        related_name='students',
    )
    full_name = models.CharField(max_length=255)
    wilaya = models.CharField(max_length=100, choices=ALGERIAN_WILAYAS)
    date_of_birth = models.DateField(null=True, blank=True)
    github_link = models.URLField(max_length=255, blank=True)
    portfolio_link = models.URLField(max_length=255, blank=True)
    profile_image = models.ImageField(
        null=True, blank=True, upload_to=profile_image_file_path,
    )
    academic_year = models.CharField(
        max_length=10,
        choices=AcademicYear.choices,
        blank=True,
    )
    professional_summary = models.TextField(
        blank=True,
        help_text='Short professional summary for the Digital CV.',
    )

    class Meta:
        verbose_name = 'Student'
        verbose_name_plural = 'Students'

    def save(self, *args, **kwargs):
        self.role = User.Roles.STUDENT
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name


class Company(User):
    """Company user — inherits all User fields directly."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.ImageField(null=True, blank=True, upload_to=logo_image_file_path)
    wilaya = models.CharField(max_length=100, choices=ALGERIAN_WILAYAS)
    website = models.URLField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    industry = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'

    def save(self, *args, **kwargs):
        self.role = User.Roles.COMPANY
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Admin(User):
    """Admin user — inherits all User fields directly."""

    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        related_name='admins',
    )
    department = models.CharField(max_length=255)
    title = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Admin'
        verbose_name_plural = 'Admins'

    def save(self, *args, **kwargs):
        self.role = User.Roles.ADMIN
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.title} - {self.email}'


class Internship(models.Model):
    """
    Represents a student's application to an InternshipOffer.
    Previously called 'Application' in the design docs.
    We keep it as 'Internship' to avoid breaking the admin code.

    Flow:
    1. Student applies → status = PENDING
    2. Company accepts → status = ACCEPTED_BY_COMPANY
    3. Admin validates → status = VALIDATED (PDF generated)
    4. Company/Admin rejects → status = REJECTED
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED_BY_COMPANY = 'accepted_by_company', 'Accepted by Company'
        VALIDATED = 'validated', 'Validated'
        REJECTED = 'rejected', 'Rejected'

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='internships',
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='internships',
    )
    offer = models.ForeignKey(
        'InternshipOffer',
        on_delete=models.CASCADE,
        related_name='applications',
        null=True,
        blank=True,
    )
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING,
    )
    rejection_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Internship'
        verbose_name_plural = 'Internships'
        ordering = ['-created_at']
        # A student can only apply once per offer
        unique_together = [('student', 'offer')]

    def __str__(self):
        return f'{self.student.full_name} @ {self.company.name} — {self.status}'


class InternshipAgreement(models.Model):
    """Stores the generated Convention de Stage PDF for an internship."""
    internship = models.OneToOneField(
        Internship, on_delete=models.CASCADE, related_name='agreement',
    )
    pdf_file = models.FileField(upload_to=agreement_file_path)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Internship Agreement'
        verbose_name_plural = 'Internship Agreements'

    def __str__(self):
        return f'Agreement for {self.internship}'
    


class InternshipOffer(models.Model):
    """
    An internship offer posted by a Company.
    Students will browse and apply to these offers.
    """

    class Type(models.TextChoices):
        PAID = 'paid', 'Paid'
        UNPAID = 'unpaid', 'Unpaid'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='offers',
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    wilaya = models.CharField(max_length=100, choices=ALGERIAN_WILAYAS, blank=True)
    is_remote = models.BooleanField(
        default=False,
        help_text='If True, this is a remote/online internship (no location or wilaya).',
    )
    type = models.CharField(
        max_length=10,
        choices=Type.choices,
        default=Type.UNPAID,
    )
    salary_per_week = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    start_date = models.DateField()
    end_date = models.DateField()
    photo = models.ImageField(
        null=True,
        blank=True,
        upload_to='uploads/offer_photos/',
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Internship Offer'
        verbose_name_plural = 'Internship Offers'

    def __str__(self):
        return f'{self.title} — {self.company.name}'

    @property
    def duration_display(self):
        """
        Human-readable duration with sensible rounding.
        - Within 5 days of a month → 'X months'
        - Within 3 days of a week  → 'X weeks'
        - Otherwise                → 'X days'
        """
        delta = (self.end_date - self.start_date).days
        if delta <= 0:
            return 'Invalid dates'

        months = delta // 30
        remaining_days = delta % 30
        
        weeks = remaining_days // 7
        days = remaining_days % 7
        
        parts = []
        if months > 0:
            parts.append(f'{months} month{"s" if months > 1 else ""}')
        if weeks > 0:
            parts.append(f'{weeks} week{"s" if weeks > 1 else ""}')
        if days > 0:
            parts.append(f'{days} day{"s" if days > 1 else ""}')
            
        if not parts:
            return "0 days"
            
        return ", ".join(parts)


class Notification(models.Model):
    """
    Notification system for all three actors.
    recipient is a base User so students, companies and admins
    can all receive notifications.
    """

    class Type(models.TextChoices):
        # Student notifications
        APPLICATION_SUBMITTED = 'application_submitted', 'Application Submitted'
        APPLICATION_ACCEPTED = 'application_accepted', 'Application Accepted by Company'
        APPLICATION_REJECTED = 'application_rejected', 'Application Rejected by Company'
        INTERNSHIP_VALIDATED = 'internship_validated', 'Internship Validated by Admin'
        # Company notifications
        NEW_APPLICANT = 'new_applicant', 'New Student Applied'
        AGREEMENT_READY = 'agreement_ready', 'Agreement Ready'
        ADMIN_REJECTED = 'admin_rejected', 'Internship Rejected by Admin'
        # Admin notifications
        INTERNSHIP_ACCEPTED = 'internship_accepted', 'Internship Accepted by Company'

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    internship = models.ForeignKey(
        Internship,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    # Optional deep link — frontend uses this to navigate on click
    link = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.notification_type} → {self.recipient.email}'
    


class OfferSkill(models.Model):
    """
    Junction table linking an InternshipOffer to a Skill.
    Same concept as StudentSkill — one row per required skill chip.
    """
    offer = models.ForeignKey(
        InternshipOffer,
        on_delete=models.CASCADE,
        related_name='offer_skills',
    )
    skill = models.ForeignKey(
        'student.Skill',
        on_delete=models.CASCADE,
        related_name='offer_skills',
    )

    class Meta:
        unique_together = ('offer', 'skill')

    def __str__(self):
        return f'{self.offer.title} → {self.skill.name}'
