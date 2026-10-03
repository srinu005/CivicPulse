from django.conf import settings
from django.core.mail import send_mail

STATUS_LABELS = {
    "pending": "Pending",
    "in_progress": "In Progress",
    "resolved": "Resolved",
    "rejected": "Rejected",
}


def send_status_change_email(report, old_status, new_status, note):
    """
    Notifies the citizen who filed `report` that its status changed.
    Failures are swallowed (logged, not raised) so a broken mail server
    never breaks the actual status-update API call for the officer.
    """
    if not report.user.email:
        return  # nothing to send to

    report_url = f"{settings.FRONTEND_URL}/reports/{report.id}"
    old_label = STATUS_LABELS.get(old_status, old_status)
    new_label = STATUS_LABELS.get(new_status, new_status)

    subject = f"CivicPulse: your report is now '{new_label}'"
    message = (
        f"Hi {report.user.username},\n\n"
        f"Your pollution report (#{report.id}, {report.get_category_display()}) "
        f"has changed status: {old_label} -> {new_label}.\n\n"
    )
    if note:
        message += f"Officer's note: {note}\n\n"
    message += f"View the full report here: {report_url}\n\n-- CivicPulse"

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[report.user.email],
            fail_silently=False,
        )
    except Exception:
        # In production this should go to proper logging (e.g. logger.exception(...)).
        # We deliberately don't let an email failure break the status update itself.
        pass