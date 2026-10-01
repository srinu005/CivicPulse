from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User

from .serializers import RegisterSerializer, UserSerializer, OfficerCreateSerializer
from .permissions import IsSuperAdmin


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


class OfficerCreateView(generics.CreateAPIView):
    """
    POST /api/officers/ -- restricted to Super Admins (is_staff).
    This is the ONLY way an officer account can be created --
    there is no public officer-signup endpoint anywhere in this API.
    """
    serializer_class = OfficerCreateSerializer
    permission_classes = [IsSuperAdmin]