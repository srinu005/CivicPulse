from django.contrib.auth.models import User
from django.core import mail
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import OfficerProfile
from .models import Report, Upvote, StatusUpdate


class ReportCreationTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user("citizen1", "c1@test.com", "testpass123")
        resp = self.client.post("/api/token/", {"username": "citizen1", "password": "testpass123"})
        self.auth = {"HTTP_AUTHORIZATION": f"Bearer {resp.json()['access']}"}
        self.payload = {
            "category": "garbage", "description": "Pile near market",
            "latitude": 17.38, "longitude": 78.48, "severity": "high",
        }

    def test_authenticated_citizen_can_create_report(self):
        resp = self.client.post("/api/reports/", self.payload, **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(pk=resp.json()["id"])
        self.assertEqual(report.user, self.citizen)
        self.assertEqual(report.status, "pending")  # must always start pending

    def test_anonymous_cannot_create_report(self):
        resp = self.client.post("/api/reports/", self.payload)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_report_owner_cannot_be_spoofed_from_request_body(self):
        """The `user` field must always come from the JWT, never client input."""
        other_user = User.objects.create_user("citizen2", "c2@test.com", "testpass123")
        payload = {**self.payload, "user": other_user.id}
        resp = self.client.post("/api/reports/", payload, **self.auth)
        report = Report.objects.get(pk=resp.json()["id"])
        self.assertEqual(report.user, self.citizen)  # not other_user


class ReportListDetailTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user("citizen1", "c1@test.com", "testpass123")
        self.r1 = Report.objects.create(user=self.citizen, category="garbage", description="A", latitude=1, longitude=1)
        self.r2 = Report.objects.create(user=self.citizen, category="water", description="B", latitude=2, longitude=2)

    def test_list_is_public_no_auth_required(self):
        resp = self.client.get("/api/reports/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.json()), 2)

    def test_filter_by_category(self):
        resp = self.client.get("/api/reports/?category=water")
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], self.r2.id)

    def test_detail_is_public_and_includes_upvote_count(self):
        resp = self.client.get(f"/api/reports/{self.r1.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json()["upvote_count"], 0)
        self.assertEqual(resp.json()["status_updates"], [])

    def test_detail_404_for_missing_report(self):
        resp = self.client.get("/api/reports/99999/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class UpvoteTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user("citizen1", "c1@test.com", "testpass123")
        self.other = User.objects.create_user("citizen2", "c2@test.com", "testpass123")
        self.report = Report.objects.create(user=self.citizen, category="garbage", description="A", latitude=1, longitude=1)
        resp = self.client.post("/api/token/", {"username": "citizen2", "password": "testpass123"})
        self.auth = {"HTTP_AUTHORIZATION": f"Bearer {resp.json()['access']}"}

    def test_upvote_then_toggle_off(self):
        resp1 = self.client.post(f"/api/reports/{self.report.id}/upvote/", **self.auth)
        self.assertEqual(resp1.json(), {"upvoted": True, "upvote_count": 1})

        resp2 = self.client.post(f"/api/reports/{self.report.id}/upvote/", **self.auth)
        self.assertEqual(resp2.json(), {"upvoted": False, "upvote_count": 0})

    def test_anonymous_cannot_upvote(self):
        resp = self.client.post(f"/api/reports/{self.report.id}/upvote/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_duplicate_upvote_blocked_at_db_level(self):
        """Even bypassing the API toggle, the DB constraint must hold."""
        Upvote.objects.create(report=self.report, user=self.other)
        with self.assertRaises(Exception):
            Upvote.objects.create(report=self.report, user=self.other)


class StatusUpdateTests(APITestCase):
    """The most security-critical endpoint: only officers may call this,
    and only along valid state-machine transitions."""

    def setUp(self):
        self.citizen = User.objects.create_user("citizen1", "c1@test.com", "testpass123")
        self.officer_user = User.objects.create_user("officer1", "o1@gov.in", "testpass123")
        OfficerProfile.objects.create(
            user=self.officer_user, designation="MRO", department="Revenue",
            jurisdiction_area="Ward 5", official_email="mro@gov.in",
        )
        self.report = Report.objects.create(user=self.citizen, category="garbage", description="A", latitude=1, longitude=1)

        r1 = self.client.post("/api/token/", {"username": "citizen1", "password": "testpass123"})
        self.citizen_auth = {"HTTP_AUTHORIZATION": f"Bearer {r1.json()['access']}"}
        r2 = self.client.post("/api/token/", {"username": "officer1", "password": "testpass123"})
        self.officer_auth = {"HTTP_AUTHORIZATION": f"Bearer {r2.json()['access']}"}

    def test_citizen_cannot_update_status(self):
        resp = self.client.patch(
            f"/api/reports/{self.report.id}/status/",
            {"status": "in_progress", "note": "x"},
            content_type="application/json", **self.citizen_auth,
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, "pending")  # unchanged

    def test_officer_can_move_pending_to_in_progress(self):
        resp = self.client.patch(
            f"/api/reports/{self.report.id}/status/",
            {"status": "in_progress", "note": "Team dispatched"},
            content_type="application/json", **self.officer_auth,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, "in_progress")

    def test_status_update_creates_audit_trail_entry(self):
        self.client.patch(
            f"/api/reports/{self.report.id}/status/",
            {"status": "in_progress", "note": "Team dispatched"},
            content_type="application/json", **self.officer_auth,
        )
        updates = StatusUpdate.objects.filter(report=self.report)
        self.assertEqual(updates.count(), 1)
        self.assertEqual(updates.first().old_status, "pending")
        self.assertEqual(updates.first().new_status, "in_progress")
        self.assertEqual(updates.first().updated_by, self.officer_user)

    def test_invalid_transition_rejected(self):
        """Cannot jump straight from pending to resolved."""
        resp = self.client.patch(
            f"/api/reports/{self.report.id}/status/",
            {"status": "resolved", "note": "x"},
            content_type="application/json", **self.officer_auth,
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, "pending")

    def test_cannot_transition_out_of_resolved(self):
        self.report.status = "resolved"
        self.report.save()
        resp = self.client.patch(
            f"/api/reports/{self.report.id}/status/",
            {"status": "in_progress", "note": "x"},
            content_type="application/json", **self.officer_auth,
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_status_value_rejected(self):
        resp = self.client.patch(
            f"/api/reports/{self.report.id}/status/",
            {"status": "not_a_real_status", "note": "x"},
            content_type="application/json", **self.officer_auth,
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_change_sends_email_to_reporter(self):
        mail.outbox = []
        self.client.patch(
            f"/api/reports/{self.report.id}/status/",
            {"status": "in_progress", "note": "Team dispatched"},
            content_type="application/json", **self.officer_auth,
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.citizen.email, mail.outbox[0].to)
        self.assertIn("In Progress", mail.outbox[0].subject)


class DashboardStatsTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user("citizen1", "c1@test.com", "testpass123")
        self.officer_user = User.objects.create_user("officer1", "o1@gov.in", "testpass123")
        OfficerProfile.objects.create(
            user=self.officer_user, designation="MRO", department="Revenue",
            jurisdiction_area="Ward 5", official_email="mro@gov.in",
        )
        Report.objects.create(user=self.citizen, category="garbage", description="A", latitude=1, longitude=1, status="pending")
        Report.objects.create(user=self.citizen, category="garbage", description="B", latitude=1, longitude=1, status="resolved")
        Report.objects.create(user=self.citizen, category="water", description="C", latitude=1, longitude=1, status="in_progress")

        r = self.client.post("/api/token/", {"username": "officer1", "password": "testpass123"})
        self.officer_auth = {"HTTP_AUTHORIZATION": f"Bearer {r.json()['access']}"}
        r2 = self.client.post("/api/token/", {"username": "citizen1", "password": "testpass123"})
        self.citizen_auth = {"HTTP_AUTHORIZATION": f"Bearer {r2.json()['access']}"}

    def test_officer_can_view_stats(self):
        resp = self.client.get("/api/dashboard/stats/", **self.officer_auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data["status_counts"]["pending"], 1)
        self.assertEqual(data["status_counts"]["resolved"], 1)
        self.assertEqual(data["category_counts"]["garbage"], 2)
        self.assertEqual(data["total_reports"], 3)

    def test_citizen_cannot_view_stats(self):
        resp = self.client.get("/api/dashboard/stats/", **self.citizen_auth)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)