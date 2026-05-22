"""Serializers for the company internship offer API."""
from datetime import date

from rest_framework import serializers
from core.models import InternshipOffer, OfferSkill
from student.models import Skill




class SkillSerializer(serializers.ModelSerializer):
    """Simple skill serializer for displaying required skills on offers."""
    class Meta:
        model = Skill
        fields = ['id', 'name']


class InternshipOfferSerializer(serializers.ModelSerializer):
    """
    Used for GET requests (list and detail).
    Shows all fields including computed duration and required skills.
    """
    duration_display = serializers.SerializerMethodField()
    company_name = serializers.CharField(
        source='company.name',
        read_only=True,
    )
    required_skills = serializers.SerializerMethodField()

    def get_duration_display(self, obj):
        return obj.duration_display

    def get_required_skills(self, obj):
        """
        Returns the list of required skills for this offer.
        We go through offer_skills (the junction table) and
        return the skill details for each one.
        """
        offer_skills = obj.offer_skills.select_related('skill').all()
        return SkillSerializer(
            [os.skill for os in offer_skills],
            many=True,
        ).data

    class Meta:
        model = InternshipOffer
        fields = [
            'id',
            'company',
            'company_name',
            'title',
            'description',
            'location',
            'wilaya',
            'is_remote',
            'type',
            'salary_per_week',
            'start_date',
            'end_date',
            'duration_display',
            'required_skills',
            'photo',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'company', 'company_name',
            'duration_display', 'required_skills',
            'created_at', 'updated_at',
        ]


class CreateInternshipOfferSerializer(serializers.ModelSerializer):
    """
    Used for POST /api/company/offers/ (create).
    skill_ids is a list of skill IDs the company selects as required.
    Example: { "skill_ids": [1, 3, 7] }
    """
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
        write_only=True,
        help_text='List of skill IDs required for this offer.',
    )


    class Meta:
        model = InternshipOffer
        fields = [
            'title',
            'description',
            'location',
            'wilaya',
            'is_remote',
            'type',
            'salary_per_week',
            'start_date',
            'end_date',
            'photo',
            'status',
            'skill_ids',
        ]
        extra_kwargs = {
            'title': {'required': True},
            'description': {'required': True},
            'location': {'required': False, 'allow_blank': True},
            'start_date': {'required': True},
            'end_date': {'required': True},
            'type': {'required': True},
            'salary_per_week': {'required': False},
            'photo': {'required': False},
            'status': {'required': False},
            'is_remote': {'required': False},
        }

    def validate_skill_ids(self, value):
        """Check all provided skill IDs actually exist."""
        if not value:
            return value
        existing = Skill.objects.filter(id__in=value)
        if existing.count() != len(set(value)):
            raise serializers.ValidationError(
                'One or more skill IDs are invalid.'
            )
        return value



    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        offer_type = data.get('type')
        salary = data.get('salary_per_week')
        is_remote = data.get('is_remote', False)

        # Remote internship validation
        if is_remote:
            data['location'] = ''
            data['wilaya'] = ''
        else:
            if not data.get('location'):
                raise serializers.ValidationError(
                    'Location is required for non-remote internships.'
                )

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError(
                    'End date must be after start date.'
                )
            delta = (end_date - start_date).days
            if delta < 14:
                raise serializers.ValidationError(
                    'Internship must be at least 2 weeks (14 days).'
                )

        if offer_type == InternshipOffer.Type.PAID:
            if not salary:
                raise serializers.ValidationError(
                    'salary_per_week is required for paid internships.'
                )
            if salary <= 0:
                raise serializers.ValidationError(
                    'salary_per_week must be a positive number.'
                )

        if offer_type == InternshipOffer.Type.UNPAID:
            data['salary_per_week'] = None

        return data

    def create(self, validated_data):
        """
        Pop skill_ids out before creating the offer
        (it's not a real DB field), then create the OfferSkill
        rows for each selected skill.
        """
        skill_ids = validated_data.pop('skill_ids', [])
        offer = InternshipOffer.objects.create(**validated_data)
        for skill_id in skill_ids:
            OfferSkill.objects.create(
                offer=offer,
                skill=Skill.objects.get(id=skill_id),
            )
        return offer


class UpdateInternshipOfferSerializer(serializers.ModelSerializer):
    """
    Used for PATCH /api/company/offers/<id>/ (partial update).
    Every field is optional. skill_ids replaces ALL current skills.
    Send [] to remove all skills, omit to keep existing ones unchanged.
    """
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        help_text='Replaces all required skills. Send [] to clear all.',
    )


    class Meta:
        model = InternshipOffer
        fields = [
            'title',
            'description',
            'location',
            'wilaya',
            'is_remote',
            'type',
            'salary_per_week',
            'start_date',
            'end_date',
            'photo',
            'status',
            'skill_ids',
        ]
        extra_kwargs = {
            'title': {'required': False},
            'description': {'required': False},
            'location': {'required': False, 'allow_blank': True},
            'wilaya': {'required': False},
            'type': {'required': False},
            'salary_per_week': {'required': False},
            'start_date': {'required': False},
            'end_date': {'required': False},
            'photo': {'required': False},
            'status': {'required': False},
            'is_remote': {'required': False},
        }

    def validate_skill_ids(self, value):
        if not value:
            return value
        existing = Skill.objects.filter(id__in=value)
        if existing.count() != len(set(value)):
            raise serializers.ValidationError(
                'One or more skill IDs are invalid.'
            )
        return value

    def validate(self, data):
        instance = self.instance
        start_date = data.get(
            'start_date', getattr(instance, 'start_date', None),
        )
        end_date = data.get(
            'end_date', getattr(instance, 'end_date', None),
        )
        offer_type = data.get(
            'type', getattr(instance, 'type', None),
        )
        salary = data.get(
            'salary_per_week', getattr(instance, 'salary_per_week', None),
        )
        is_remote = data.get(
            'is_remote', getattr(instance, 'is_remote', False),
        )

        # Remote internship validation
        if is_remote:
            data['location'] = ''
            data['wilaya'] = ''

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError(
                    'End date must be after start date.'
                )
            delta = (end_date - start_date).days
            if delta < 14:
                raise serializers.ValidationError(
                    'Internship must be at least 2 weeks (14 days).'
                )

        if offer_type == InternshipOffer.Type.PAID:
            if not salary:
                raise serializers.ValidationError(
                    'salary_per_week is required for paid internships.'
                )
            if salary <= 0:
                raise serializers.ValidationError(
                    'salary_per_week must be a positive number.'
                )

        if offer_type == InternshipOffer.Type.UNPAID:
            data['salary_per_week'] = None

        # Prevent reopening an offer whose start date has already passed
        new_status = data.get('status')
        if new_status == InternshipOffer.Status.OPEN and start_date:
            if start_date <= date.today():
                raise serializers.ValidationError(
                    'Cannot reopen this offer because its start date '
                    'has already passed. Please update the start date '
                    'to a future date before reopening.'
                )

        return data

    def update(self, instance, validated_data):
        """
        If skill_ids is present in the request, replace all
        existing skills with the new ones.
        If skill_ids is absent, leave skills untouched.
        """
        skill_ids = validated_data.pop('skill_ids', None)

        # Update all regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Only update skills if skill_ids was explicitly sent
        if skill_ids is not None:
            # Delete all existing required skills for this offer
            OfferSkill.objects.filter(offer=instance).delete()
            # Add the new ones
            for skill_id in skill_ids:
                OfferSkill.objects.create(
                    offer=instance,
                    skill=Skill.objects.get(id=skill_id),
                )

        return instance
    

class StudentDigitalCVSerializer(serializers.ModelSerializer):
    """
    Full Digital CV shown to the company when reviewing applicants.
    Shows personal info, academic/professional details, and skills.
    """
    from student.models import Skill

    skills = serializers.SerializerMethodField()
    profile_image = serializers.ImageField(read_only=True)
    university_name = serializers.CharField(
        source='university.name', read_only=True, default=None,
    )
    university_wilaya = serializers.CharField(
        source='university.wilaya', read_only=True, default=None,
    )

    def get_skills(self, obj):
        student_skills = obj.student_skills.select_related('skill').all()
        return [
            {'id': ss.skill.id, 'name': ss.skill.name}
            for ss in student_skills
        ]

    class Meta:
        from core.models import Student
        model = Student
        fields = [
            # Personal info
            'id',
            'full_name',
            'email',
            'wilaya',
            'date_of_birth',
            'profile_image',
            # Academic & professional
            'university_name',
            'university_wilaya',
            'academic_year',
            'professional_summary',
            'github_link',
            'portfolio_link',
            # Skills
            'skills',
        ]


class ApplicantSerializer(serializers.ModelSerializer):
    """
    One applicant row shown in the company's applicants dashboard.
    Combines the application status with the student's Digital CV.
    """
    student = StudentDigitalCVSerializer(read_only=True)
    offer_title = serializers.CharField(source='offer.title', read_only=True)

    class Meta:
        from core.models import Internship
        model = Internship
        fields = [
            'id',
            'offer_title',
            'student',
            'status',
            'created_at',
            'updated_at',
        ]