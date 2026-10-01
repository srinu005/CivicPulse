from django.contrib import admin
from .models import OfficerProfile


@admin.register(OfficerProfile)
class OfficerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "designation", "department", "jurisdiction_area", "created_at")
    list_filter = ("designation", "department")
    search_fields = ("user__username", "official_email", "jurisdiction_area")