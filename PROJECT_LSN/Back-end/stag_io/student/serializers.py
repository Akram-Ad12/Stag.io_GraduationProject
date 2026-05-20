"""Serializers for the student app — skills, internship search, and Digital CV."""
from rest_framework import serializers
from core.models import (
    InternshipOffer, OfferSkill, Internship, InternshipAgreement,
    Student, University,
)
from student.models import Skill, StudentSkill


# ── Skill serializers ────────────────────────────────────────────────

class SkillSerializer(serializers.ModelSerializer):
    """Simple skill — used in chips UI."""
    class Meta:
        model = Skill
        fields = ['id', 'name']


class StudentSkillSerializer(serializers.ModelSerializer):
    """A skill chip on the student's profile."""
    skill = SkillSerializer(read_only=True)

    class Meta:
        model = StudentSkill
        fields = ['id', 'skill']


class AddStudentSkillSerializer(serializers.Serializer):
    """Validates incoming skill_id when adding a chip."""
    skill_id = serializers.IntegerField()

    def validate_skill_id(self, value):
        if not Skill.objects.filter(id=value).exists():
            raise serializers.ValidationError('Skill not found.')
        return value


# ── Offer serializers (student view) ────────────────────────────────

class OfferSkillSerializer(serializers.ModelSerializer):
    """Skill chip shown on an offer."""
    id = serializers.IntegerField(source='skill.id')
    name = serializers.CharField(source='skill.name')

    class Meta:
        model = OfferSkill
        fields = ['id', 'name']


class StudentOfferListSerializer(serializers.ModelSerializer):
    """
    Compact offer card shown in the search/list page.
    Shows key info without the full description.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_logo = serializers.ImageField(source='company.logo', read_only=True)
    duration_display = serializers.SerializerMethodField()
    required_skills = serializers.SerializerMethodField()
    already_applied = serializers.SerializerMethodField()

    def get_duration_display(self, obj):
        return obj.duration_display

    def get_required_skills(self, obj):
        return OfferSkillSerializer(
            obj.offer_skills.select_related('skill').all(),
            many=True,
        ).data

    def get_already_applied(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        from core.models import Internship
        return Internship.objects.filter(
            student_id=request.user.pk,
            offer=obj,
        ).exists()

    class Meta:
        model = InternshipOffer
        fields = [
            'id',
            'company_name',
            'company_logo',
            'title',
            'wilaya',
            'is_remote',
            'type',
            'salary_per_week',
            'duration_display',
            'required_skills',
            'photo',
            'start_date',
            'end_date',
            'status',
            'created_at',
            'already_applied',
        ]


class StudentOfferDetailSerializer(serializers.ModelSerializer):
    """
    Full offer detail shown when a student clicks on an offer.
    Includes everything including description and photo.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_logo = serializers.ImageField(source='company.logo', read_only=True)
    company_wilaya = serializers.CharField(source='company.wilaya', read_only=True)
    company_website = serializers.URLField(source='company.website', read_only=True)
    company_details = serializers.SerializerMethodField()
    duration_display = serializers.SerializerMethodField()
    required_skills = serializers.SerializerMethodField()
    already_applied = serializers.SerializerMethodField()

    def get_duration_display(self, obj):
        return obj.duration_display

    def get_required_skills(self, obj):
        return OfferSkillSerializer(
            obj.offer_skills.select_related('skill').all(),
            many=True,
        ).data

    def get_already_applied(self, obj):
        """
        Tells the frontend whether this student already applied.
        Used to disable the Apply button if they have.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Internship.objects.filter(
            student_id=request.user.pk,
            offer=obj,
        ).exists()

    def get_company_details(self, obj):
        company = obj.company
        if not company:
            return None
        return {
            'name': company.name,
            'description': company.description,
            'industry': getattr(company, 'industry', None),
            'wilaya': company.wilaya,
            'phone_number': getattr(company, 'phone_number', None),
            'website': company.website,
        }

    class Meta:
        model = InternshipOffer
        fields = [
            'id',
            'company_details',
            'company_name',
            'company_logo',
            'company_wilaya',
            'company_website',
            'title',
            'description',
            'location',
            'wilaya',
            'is_remote',
            'type',
            'salary_per_week',
            'duration_display',
            'required_skills',
            'photo',
            'status',
            'start_date',
            'end_date',
            'created_at',
            'already_applied',
        ]


# ── Application serializers ──────────────────────────────────────────

class ApplicationListSerializer(serializers.ModelSerializer):
    """
    Compact application card shown in 'My Applications' list.
    """
    offer_title = serializers.CharField(source='offer.title', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_logo = serializers.ImageField(source='company.logo', read_only=True)
    wilaya = serializers.CharField(source='offer.wilaya', read_only=True)
    offer_type = serializers.CharField(source='offer.type', read_only=True)

    class Meta:
        model = Internship
        fields = [
            'id',
            'offer_title',
            'company_name',
            'company_logo',
            'wilaya',
            'offer_type',
            'status',
            'rejection_reason',
            'created_at',
        ]


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """
    Full application detail — shown when student clicks one application.
    Includes offer info, status, and agreement download availability.
    """
    offer_title = serializers.CharField(source='offer.title', read_only=True)
    offer_description = serializers.CharField(
        source='offer.description', read_only=True,
    )
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_logo = serializers.ImageField(source='company.logo', read_only=True)
    wilaya = serializers.CharField(source='offer.wilaya', read_only=True)
    offer_type = serializers.CharField(source='offer.type', read_only=True)
    salary_per_week = serializers.DecimalField(
        source='offer.salary_per_week',
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    start_date = serializers.DateField(source='offer.start_date', read_only=True)
    end_date = serializers.DateField(source='offer.end_date', read_only=True)
    duration_display = serializers.SerializerMethodField()
    required_skills = serializers.SerializerMethodField()
    agreement_available = serializers.SerializerMethodField()

    def get_duration_display(self, obj):
        return obj.offer.duration_display if obj.offer else None

    def get_required_skills(self, obj):
        if not obj.offer:
            return []
        return OfferSkillSerializer(
            obj.offer.offer_skills.select_related('skill').all(),
            many=True,
        ).data

    def get_agreement_available(self, obj):
        """
        True only if status is VALIDATED and a PDF exists.
        The frontend uses this to show/hide the Download button.
        """
        return (
            obj.status == Internship.Status.VALIDATED
            and hasattr(obj, 'agreement')
            and bool(obj.agreement.pdf_file)
        )

    class Meta:
        model = Internship
        fields = [
            'id',
            'offer_title',
            'offer_description',
            'subject',
            'description',
            'company_name',
            'company_logo',
            'wilaya',
            'offer_type',
            'salary_per_week',
            'start_date',
            'end_date',
            'duration_display',
            'required_skills',
            'status',
            'agreement_available',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]


class StudentDocumentListSerializer(serializers.ModelSerializer):
    """
    Lists the generated documents for a student.
    """
    offer_title = serializers.CharField(source='internship.offer.title', read_only=True)
    company_name = serializers.CharField(source='internship.company.name', read_only=True)
    application_id = serializers.IntegerField(source='internship.id', read_only=True)

    class Meta:
        model = InternshipAgreement
        fields = [
            'id',
            'application_id',
            'offer_title',
            'company_name',
            'generated_at',
        ]


# ── Digital CV serializers ───────────────────────────────────────────

class UniversitySerializer(serializers.ModelSerializer):
    """University info for the Digital CV dropdown."""
    class Meta:
        model = University
        fields = ['id', 'name', 'code', 'wilaya']


class DigitalCVSerializer(serializers.ModelSerializer):
    """
    Read-only Digital CV shown to the student, companies, and admins.
    Combines personal profile info (read-only) with academic/professional
    data and the student's selected skills.
    """
    skills = serializers.SerializerMethodField()
    university = UniversitySerializer(read_only=True)
    profile_image = serializers.ImageField(read_only=True)

    def get_skills(self, obj):
        student_skills = obj.student_skills.select_related('skill').all()
        return [
            {'id': ss.skill.id, 'name': ss.skill.name}
            for ss in student_skills
        ]

    class Meta:
        model = Student
        fields = [
            # Personal info (from profile — read-only on CV)
            'id',
            'full_name',
            'email',
            'wilaya',
            'date_of_birth',
            'profile_image',
            # Academic & professional (editable on CV)
            'university',
            'academic_year',
            'professional_summary',
            'github_link',
            'portfolio_link',
            # Skills (managed via separate endpoints)
            'skills',
        ]
        read_only_fields = fields


class DigitalCVUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for students to update their Digital CV fields.
    Personal info (name, email, wilaya) is managed via the profile endpoint.
    Skills are managed via the add/remove skill endpoints.
    University is auto-assigned at registration and CANNOT be changed.
    """

    class Meta:
        model = Student
        fields = [
            'academic_year',
            'professional_summary',
            'github_link',
            'portfolio_link',
        ]
        extra_kwargs = {
            'academic_year': {'required': False, 'allow_blank': True},
            'professional_summary': {'required': False, 'allow_blank': True},
            'github_link': {'required': False, 'allow_blank': True},
            'portfolio_link': {'required': False, 'allow_blank': True},
        }

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance