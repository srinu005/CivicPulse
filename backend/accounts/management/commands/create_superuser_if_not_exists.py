import os
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Creates a superuser from DJANGO_SUPERUSER_* env vars, but only if one
    with that username doesn't already exist. Safe to run on EVERY deploy
    (unlike Django's built-in createsuperuser --noinput, which errors out
    the second time) -- needed because Render's free tier has no Shell
    access, so this has to run automatically as part of the build command.
    """

    help = "Create a superuser from env vars if it doesn't already exist (idempotent)."

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(self.style.WARNING(
                "DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_PASSWORD not set -- skipping."
            ))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' already exists -- skipping."))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created."))