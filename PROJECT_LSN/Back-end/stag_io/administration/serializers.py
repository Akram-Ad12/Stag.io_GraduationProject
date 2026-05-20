"""Serializers for the administration API."""
from rest_framework import serializers
from core.models import Internship, InternshipAgreement, Notification, Student


class InternshipAgreementSerializer(serializers.ModelSerializer):
    """Read-only serializer for internship agreement metadata."""
    pdf_url = serializers.FileField(source='pdf_file', read_only=True)

    class Meta:
        model = InternshipAgreement
        fields = ['id', 'pdf_url', 'generated_at']
        read_only_fields = fields


class StudentDigitalCVForAdminSerializer(serializers.ModelSerializer):
    """
    Student Digital CV shown to admin when reviewing internship applications.
    Includes personal info, academic/professional details, and skills.
    """
    skills = serializers.SerializerMethodField()
    university_name = serializers.CharField(
        source='university.name', read_only=True, default=None,
    )
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
            'id',
            'full_name',
            'email',
            'wilaya',
            'date_of_birth',
            'profile_image',
            'university_name',
            'academic_year',
            'professional_summary',
            'github_link',
            'portfolio_link',
            'skills',
        ]


class AdminInternshipSerializer(serializers.ModelSerializer):
    """Read-only serializer for admin to review internships."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True,
    )
    company_name = serializers.CharField(
        source='company.name', read_only=True,
    )
    student_email = serializers.EmailField(
        source='student.email', read_only=True,
    )
    company_email = serializers.EmailField(
        source='company.email', read_only=True,
    )
    student_image = serializers.ImageField(
        source='student.profile_image', read_only=True,
    )

    class Meta:
        model = Internship
        fields = [
            'id',
            'student',
            'student_name',
            'student_email',
            'company',
            'company_name',
            'company_email',
            'subject',
            'description',
            'start_date',
            'end_date',
            'status',
            'student_image',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminInternshipDetailSerializer(AdminInternshipSerializer):
    """Detailed internship serializer with agreement and student Digital CV."""
    agreement = InternshipAgreementSerializer(read_only=True)
    student_cv = StudentDigitalCVForAdminSerializer(
        source='student', read_only=True,
    )
    offer_details = serializers.SerializerMethodField()
    company_details = serializers.SerializerMethodField()

    def get_offer_details(self, obj):
        if obj.offer:
            from company.serializers import InternshipOfferSerializer
            return InternshipOfferSerializer(obj.offer).data
        return None

    def get_company_details(self, obj):
        if obj.company:
            return {
                'logo': obj.company.logo.url if getattr(obj.company, 'logo', None) else None,
                'name': obj.company.name,
                'description': obj.company.description,
                'wilaya': obj.company.wilaya,
                'website': obj.company.website,
                'phone_number': obj.company.phone_number,
                'industry': obj.company.industry,
            }
        return None

    class Meta(AdminInternshipSerializer.Meta):
        fields = AdminInternshipSerializer.Meta.fields + [
            'agreement', 'student_cv', 'offer_details', 'company_details',
        ]


class NotificationSerializer(serializers.ModelSerializer):
    """Universal notification serializer for all actors."""
    internship_id = serializers.IntegerField(
        source='internship.id', read_only=True,
    )
    offer_id = serializers.IntegerField(
        source='internship.offer.id', read_only=True, allow_null=True,
    )
    student_name = serializers.CharField(
        source='internship.student.full_name', read_only=True,
    )
    company_name = serializers.CharField(
        source='internship.company.name', read_only=True,
    )
    internship_subject = serializers.CharField(
        source='internship.subject', read_only=True,
    )
    internship_status = serializers.CharField(
        source='internship.status', read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            'id',
            'internship_id',
            'offer_id',
            'notification_type',
            'message',
            'link',
            'student_name',
            'company_name',
            'internship_subject',
            'internship_status',
            'is_read',
            'created_at',
        ]
        read_only_fields = [
            'id', 'notification_type', 'message',
            'link', 'created_at',
        ]