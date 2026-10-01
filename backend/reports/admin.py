from django.contrib import admin
from .models import Report, StatusUpdate, Upvote


class StatusUpdateInline(admin.TabularInline):
    model = StatusUpdate
    extra = 0
    readonly_fields = ("old_status", "new_status", "note", "updated_by", "timestamp")
    can_delete = False


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "category", "status", "severity", "user", "created_at")
    list_filter = ("category", "status", "severity")
    search_fields = ("description", "address", "user__username")
    inlines = [StatusUpdateInline]


@admin.register(Upvote)
class UpvoteAdmin(admin.ModelAdmin):
    list_display = ("report", "user", "created_at")