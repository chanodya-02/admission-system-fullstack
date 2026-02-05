from django.contrib import admin
from .models import Application

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("id", "applicant_name", "grade_level", "status", "created_at")
    list_filter = ("status", "gender")
    search_fields = ("applicant_name",)
