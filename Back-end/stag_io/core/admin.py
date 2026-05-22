"""Django admin."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from core import models


class UserAdmin(BaseUserAdmin):
    """Admin page for base User model."""
    ordering = ['id']
    list_display = ['email', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Role'), {'fields': ('role',)}),
        (
            _('Permissions'),
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                )
            }
        ),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    readonly_fields = ['last_login']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'password1',
                'password2',
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
            )
        }),
    )


class StudentAdmin(BaseUserAdmin):
    """Admin page for Students."""
    ordering = ['id']
    list_display = ['email', 'full_name', 'wilaya', 'academic_year', 'is_active']
    search_fields = ['email', 'full_name']
    list_filter = ['wilaya', 'academic_year', 'is_active']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('full_name', 'wilaya', 'date_of_birth', 'profile_image')}),
        (_('Digital CV'), {'fields': ('university', 'academic_year', 'professional_summary', 'github_link', 'portfolio_link')}),
        (_('Permissions'), {'fields': ('is_active',)}),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    readonly_fields = ['last_login']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'full_name', 'university', 'wilaya'),
        }),
    )


class CompanyAdmin(BaseUserAdmin):
    """Admin page for Companies."""
    ordering = ['id']
    list_display = ['email', 'name', 'wilaya', 'is_active']
    search_fields = ['email', 'name']
    list_filter = ['wilaya', 'is_active']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Company Info'), {'fields': ('name', 'description', 'logo', 'wilaya', 'website')}),
        (_('Permissions'), {'fields': ('is_active',)}),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    readonly_fields = ['last_login']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'name', 'wilaya'),
        }),
    )


class AdminProfileAdmin(BaseUserAdmin):
    """Admin page for Admins."""
    ordering = ['id']
    list_display = ['email', 'title', 'department', 'is_active']
    search_fields = ['email', 'title']
    list_filter = ['department', 'is_active']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Admin Info'), {'fields': ('university', 'department', 'title')}),
        (_('Permissions'), {'fields': ('is_active',)}),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    readonly_fields = ['last_login']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'university', 'department', 'title'),
        }),
    )


class OfferSkillInline(admin.TabularInline):
    """Inline for managing skills required by an offer."""
    model = models.OfferSkill
    extra = 1


class InternshipOfferAdmin(admin.ModelAdmin):
    """Admin page for Internship Offers."""
    list_display = ['title', 'company', 'location', 'wilaya', 'type', 'status', 'start_date', 'end_date', 'created_at']
    list_filter = ['status', 'type', 'wilaya', 'created_at']
    search_fields = ['title', 'description', 'company__name', 'location']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OfferSkillInline]


class InternshipAdmin(admin.ModelAdmin):
    """Admin page for Internships (applications)."""
    list_display = ['student', 'company', 'offer', 'subject', 'status', 'start_date', 'end_date', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['student__full_name', 'company__name', 'subject']
    readonly_fields = ['created_at', 'updated_at']


class InternshipAgreementAdmin(admin.ModelAdmin):
    """Admin page for Internship Agreements."""
    list_display = ['internship', 'generated_at']
    readonly_fields = ['generated_at']


class NotificationAdmin(admin.ModelAdmin):
    """Admin page for Notifications."""
    list_display = ['recipient', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__email', 'message']
    readonly_fields = ['created_at']


class UniversityAdmin(admin.ModelAdmin):
    """Admin page for Universities."""
    list_display = ['name', 'code', 'email_domain', 'wilaya']
    search_fields = ['name', 'code', 'email_domain', 'wilaya']
    list_filter = ['wilaya']


admin.site.register(models.User, UserAdmin)
admin.site.register(models.Student, StudentAdmin)
admin.site.register(models.Company, CompanyAdmin)
admin.site.register(models.Admin, AdminProfileAdmin)
admin.site.register(models.University, UniversityAdmin)
admin.site.register(models.Internship, InternshipAdmin)
admin.site.register(models.InternshipAgreement, InternshipAgreementAdmin)
admin.site.register(models.Notification, NotificationAdmin)
admin.site.register(models.InternshipOffer, InternshipOfferAdmin)
admin.site.register(models.OfferSkill)