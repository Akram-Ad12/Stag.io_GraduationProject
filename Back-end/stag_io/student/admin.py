"""Django admin for student app models."""
from django.contrib import admin
from student.models import Skill, StudentSkill


class StudentSkillInline(admin.TabularInline):
    """Inline for managing a student's skills."""
    model = StudentSkill
    extra = 1


class SkillAdmin(admin.ModelAdmin):
    """Admin page for Skills."""
    list_display = ['name']
    search_fields = ['name']
    inlines = [StudentSkillInline]


class StudentSkillAdmin(admin.ModelAdmin):
    """Admin page for Student-Skill associations."""
    list_display = ['student', 'skill']
    list_filter = ['skill']
    search_fields = ['student__full_name', 'skill__name']


admin.site.register(Skill, SkillAdmin)
admin.site.register(StudentSkill, StudentSkillAdmin)
