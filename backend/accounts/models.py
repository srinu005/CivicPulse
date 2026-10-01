from django.contrib.auth.models import User
from django.db import models


class OfficerProfile(models.Model):
    """
    Marks a User as a verified officer. A user WITHOUT an OfficerProfile
    is treated as an ordinary citizen. Officer accounts are never created
    through public registration -- only via the officer-provisioning
    endpoint, which itself requires Super Admin (is_staff) permission.
    """

    DESIGNATION_CHOICES = [
        ("MDO", "Mandal Development Officer"),
        ("MRO", "Mandal Revenue Officer"),
        ("MUNICIPAL", "Municipal Officer"),
        ("POLLUTION_BOARD", "Pollution Control Board Officer"),
        ("OTHER", "Other Designated Authority"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="officer_profile")
    designation = models.CharField(max_length=20, choices=DESIGNATION_CHOICES)
    department = models.CharField(max_length=150)
    jurisdiction_area = models.CharField(max_length=150, help_text="e.g. a ward, mandal, or district name")
    official_email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_designation_display()})"