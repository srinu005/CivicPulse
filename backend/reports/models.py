from django.contrib.auth.models import User
from django.db import models


class Report(models.Model):
    CATEGORY_CHOICES = [
        ("air", "Air Pollution"),
        ("water", "Water Pollution"),
        ("garbage", "Garbage / Waste"),
        ("noise", "Noise Pollution"),
        ("plastic", "Plastic Dumping"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("rejected", "Rejected"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reports")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    photo = models.ImageField(upload_to="reports/", blank=True, null=True)

    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=255, blank=True)

    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.get_category_display()} - {self.status} (#{self.id})"


class StatusUpdate(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="status_updates")
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="status_updates_made")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Report #{self.report_id}: {self.old_status} -> {self.new_status}"


class Upvote(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="upvotes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="upvotes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["report", "user"], name="one_upvote_per_user_per_report")
        ]

    def __str__(self):
        return f"{self.user.username} upvoted Report #{self.report_id}"