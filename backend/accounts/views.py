from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User

from .serializers import RegisterSerializer, UserSerializer, OfficerCreateSerializer, OfficerListSerializer
from .permissions import IsSuperAdmin
from .models import OfficerProfile


class RegisterView(generics.CreateAPIView):
    """POST /api/register/ -- open to anyone. Creates a CITIZEN account only."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """GET /api/me/ -- returns the logged-in user's profile, including role."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class OfficerListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/officers/ -- list all provisioned officers (Super Admin only)
    POST /api/officers/ -- provision a new officer account (Super Admin only)
    This is the ONLY way an officer account can ever be created --
    there is no public officer-signup endpoint anywhere in this API.
    """
    queryset = OfficerProfile.objects.select_related("user").order_by("-created_at")
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        return OfficerCreateSerializer if self.request.method == "POST" else OfficerListSerializer