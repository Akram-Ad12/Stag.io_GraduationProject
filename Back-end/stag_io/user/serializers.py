"""Serializers for the user API."""
from django.contrib.auth import get_user_model

from rest_framework import serializers

from core.models import Student, Company, University, UNIVERSITY_EMAIL_DOMAINS


class StudentRegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering a new student."""
    password = serializers.CharField(
        write_only=True,
        min_length=5,
        style={'input_type': 'password'},
    )

    class Meta:
        model = Student
        fields = [
            'email', 'password',
            'full_name', 'wilaya',
        ]

    def validate_email(self, value):
        """
        Ensure the student registers with one of the 5 predefined
        university email domains. The university is auto-assigned.
        """
        domain = value.split('@')[-1].lower()
        if domain not in UNIVERSITY_EMAIL_DOMAINS:
            allowed = ', '.join(
                f'@{d}' for d in UNIVERSITY_EMAIL_DOMAINS.keys()
            )
            raise serializers.ValidationError(
                f'Students must register with a university email. '
                f'Allowed domains: {allowed}'
            )
        return value

    def create(self, validated_data):
        """Create and return a student with encrypted password.
        Automatically assigns the university based on email domain.
        """
        password = validated_data.pop('password')
        # Determine university from email domain
        email = validated_data['email']
        domain = email.split('@')[-1].lower()
        uni_code = UNIVERSITY_EMAIL_DOMAINS[domain]
        university = University.objects.get(code=uni_code)
        validated_data['university'] = university
        student = Student(**validated_data)
        student.set_password(password)
        student.save()
        return student


class CompanyRegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering a new company."""
    password = serializers.CharField(
        write_only=True,
        min_length=5,
        style={'input_type': 'password'},
    )

    class Meta:
        model = Company
        fields = [
            'email', 'password',
            'name', 'description',
            'wilaya', 'website',
            'phone_number',
        ]

    def create(self, validated_data):
        """Create and return a company with encrypted password."""
        password = validated_data.pop('password')
        company = Company(**validated_data)
        company.set_password(password)
        company.save()
        return company


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for the authenticated user detail (GET /me)."""

    profile_image = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ['id', 'email', 'role', 'is_active', 'created_at', 'profile_image', 'logo', 'full_name', 'name']
        read_only_fields = ['id', 'role', 'is_active', 'created_at']

    def get_profile_image(self, obj):
        if obj.role == 'student' and hasattr(obj, 'student') and obj.student.profile_image:
            return self.context['request'].build_absolute_uri(obj.student.profile_image.url) if 'request' in self.context else obj.student.profile_image.url
        return None

    def get_logo(self, obj):
        if obj.role == 'company' and hasattr(obj, 'company') and obj.company.logo:
            return self.context['request'].build_absolute_uri(obj.company.logo.url) if 'request' in self.context else obj.company.logo.url
        return None

    def get_full_name(self, obj):
        if obj.role == 'student' and hasattr(obj, 'student'):
            return obj.student.full_name
        return None

    def get_name(self, obj):
        if obj.role == 'company' and hasattr(obj, 'company'):
            return obj.company.name
        return None


class StudentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating student personal profile fields."""

    class Meta:
        model = Student
        fields = [
            'id', 'email',
            'full_name', 'wilaya',
            'date_of_birth', 'profile_image',
        ]
        read_only_fields = ['id', 'email', 'profile_image']
        extra_kwargs = {
            'full_name': {'required': False},
            'wilaya': {'required': False},
            'date_of_birth': {'required': False},
        }


class CompanyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating company profile fields."""

    class Meta:
        model = Company
        fields = [
            'id', 'email',
            'name', 'description',
            'wilaya', 'website', 'logo',
            'phone_number', 'industry',
        ]
        read_only_fields = ['id', 'email', 'logo']
        extra_kwargs = {
            'name': {'required': False},
            'description': {'required': False},
            'wilaya': {'required': False},
            'website': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'industry': {'required': False, 'allow_blank': True},
        }

class LogoImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to logos."""

    class Meta:
        model = Company
        fields = ['id', 'logo']
        read_only_fields = ['id']
        extra_kwargs = {
            'logo': {'required': True},
        }


class ProfileImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading student profile images."""

    class Meta:
        model = Student
        fields = ['id', 'profile_image']
        read_only_fields = ['id']
        extra_kwargs = {
            'profile_image': {'required': True},
        }


class UniversitySerializer(serializers.ModelSerializer):
    """Serializer for listing universities (public, no auth required)."""

    class Meta:
        model = University
        fields = ['id', 'name', 'code', 'email_domain', 'wilaya']
