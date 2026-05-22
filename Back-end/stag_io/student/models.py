"""Models for the student app — Skills system."""
from django.db import models
from core.models import Student


class Skill(models.Model):
    """
    A single technical skill (e.g. React, Python, Django).
    Pre-created by the system. Students pick from this fixed list.
    """
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class StudentSkill(models.Model):
    """
    Junction table linking a Student to a Skill.
    One row = one chip on the student's profile.
    Adding a chip creates a row. Clicking X deletes it.
    """
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='student_skills',
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='student_skills',
    )

    class Meta:
        unique_together = ('student', 'skill')

    def __str__(self):
        return f'{self.student.full_name} → {self.skill.name}'