from rest_framework.permissions import BasePermission


class IsOfficer(BasePermission):
    """
    Grants access only to users who have an OfficerProfile.
    A plain citizen (no OfficerProfile) is denied, even if authenticated.
    """

    message = "Only verified officers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "officer_profile")
        )


class IsSuperAdmin(BasePermission):
    """
    Grants access only to Django staff/superusers -- used for the
    officer-provisioning endpoint. Officer accounts must never be
    creatable by anyone other than a Super Admin.
    """

    message = "Only a Super Admin can provision officer accounts."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)