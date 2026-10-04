from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from .models import OfficerProfile


class RegistrationTests(APITestCase):
    def test_citizen_can_register(self):
        resp = self.client.post("/api/register/", {
            "username": "citizen1", "email": "c1@test.com", "password": "testpass123",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="citizen1").exists())
        # Registration must never create an OfficerProfile -- citizen only
        user = User.objects.get(username="citizen1")
        self.assertFalse(hasattr(user, "officer_profile"))

    def test_duplicate_username_rejected(self):
        User.objects.create_user("citizen1", "a@test.com", "pass12345")
        resp = self.client.post("/api/register/", {
            "username": "citizen1", "email": "b@test.com", "password": "testpass123",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_password_rejected(self):
        resp = self.client.post("/api/register/", {
            "username": "citizen2", "email": "c2@test.com", "password": "123",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class MeEndpointTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user("citizen1", "c1@test.com", "testpass123")
        self.officer_user = User.objects.create_user("officer1", "o1@gov.in", "testpass123")
        OfficerProfile.objects.create(
            user=self.officer_user, designation="MRO", department="Revenue",
            jurisdiction_area="Ward 5", official_email="mro@gov.in",
        )
        self.admin = User.objects.create_user("admin1", "admin@civicpulse.local", "testpass123", is_staff=True)

    def _login(self, username, password):
        resp = self.client.post("/api/token/", {"username": username, "password": password})
        return resp.json()["access"]

    def _auth(self, token):
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_citizen_role_is_citizen(self):
        token = self._login("citizen1", "testpass123")
        resp = self.client.get("/api/me/", **self._auth(token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["role"], "citizen")
        self.assertIsNone(resp.json()["officer_profile"])

    def test_officer_role_is_officer_with_profile(self):
        token = self._login("officer1", "testpass123")
        resp = self.client.get("/api/me/", **self._auth(token))
        self.assertEqual(resp.json()["role"], "officer")
        self.assertEqual(resp.json()["officer_profile"]["designation"], "MRO")

    def test_staff_user_role_is_admin(self):
        token = self._login("admin1", "testpass123")
        resp = self.client.get("/api/me/", **self._auth(token))
        self.assertEqual(resp.json()["role"], "admin")

    def test_me_requires_authentication(self):
        resp = self.client.get("/api/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class OfficerProvisioningTests(APITestCase):
    """
    Covers the core access-control requirement of this project:
    officer accounts can ONLY be created by a Super Admin, never
    through public registration.
    """

    def setUp(self):
        self.admin = User.objects.create_user("admin1", "admin@civicpulse.local", "testpass123", is_staff=True)
        self.citizen = User.objects.create_user("citizen1", "c1@test.com", "testpass123")
        self.officer_payload = {
            "username": "newofficer", "email": "newofficer@example.com", "password": "officerpass123",
            "designation": "MDO", "department": "Development",
            "jurisdiction_area": "Ward 7", "official_email": "mdo@gov.in",
        }

    def _token(self, username, password):
        resp = self.client.post("/api/token/", {"username": username, "password": password})
        return {"HTTP_AUTHORIZATION": f"Bearer {resp.json()['access']}"}

    def test_admin_can_create_officer(self):
        auth = self._token("admin1", "testpass123")
        resp = self.client.post("/api/officers/", self.officer_payload, **auth)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newofficer").exists())
        new_user = User.objects.get(username="newofficer")
        self.assertTrue(hasattr(new_user, "officer_profile"))

    def test_citizen_cannot_create_officer(self):
        auth = self._token("citizen1", "testpass123")
        resp = self.client.post("/api/officers/", self.officer_payload, **auth)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(username="newofficer").exists())

    def test_anonymous_cannot_create_officer(self):
        resp = self.client.post("/api/officers/", self.officer_payload)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_citizen_cannot_list_officers(self):
        auth = self._token("citizen1", "testpass123")
        resp = self.client.get("/api/officers/", **auth)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_officers(self):
        OfficerProfile.objects.create(
            user=User.objects.create_user("officer9", "o9@gov.in", "pass12345"),
            designation="MRO", department="Revenue", jurisdiction_area="Ward 1", official_email="o9@gov.in",
        )
        auth = self._token("admin1", "testpass123")
        resp = self.client.get("/api/officers/", **auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.json()), 1)

    def test_newly_created_officer_can_log_in_and_has_officer_role(self):
        auth = self._token("admin1", "testpass123")
        self.client.post("/api/officers/", self.officer_payload, **auth)

        login_resp = self.client.post("/api/token/", {"username": "newofficer", "password": "officerpass123"})
        self.assertEqual(login_resp.status_code, 200)

        officer_auth = {"HTTP_AUTHORIZATION": f"Bearer {login_resp.json()['access']}"}
        me_resp = self.client.get("/api/me/", **officer_auth)
        self.assertEqual(me_resp.json()["role"], "officer")

    def test_no_public_officer_registration_endpoint_exists(self):
        """
        There must be no way for an anonymous user to create an officer
        account anywhere in the API -- this is the core security property
        of the whole access-control design.
        """
        resp = self.client.post("/api/officers/", self.officer_payload)
        self.assertNotEqual(resp.status_code, status.HTTP_201_CREATED)