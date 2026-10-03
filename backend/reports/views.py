from django.db.models import Count
from rest_framework import generics, permissions, status as http_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from accounts.permissions import IsOfficer
from .models import Report, Upvote
from .serializers import (
    ReportCreateSerializer, ReportListSerializer, ReportDetailSerializer,
)


class ReportListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reports/   -- public, supports ?category=, ?status=, ?severity= filters
    POST /api/reports/   -- auth required; creates a report owned by the requester
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        return ReportCreateSerializer if self.request.method == "POST" else ReportListSerializer

    def get_queryset(self):
        qs = Report.objects.annotate(upvote_count=Count("upvotes")).select_related("user")

        category = self.request.query_params.get("category")
        status_param = self.request.query_params.get("status")
        severity = self.request.query_params.get("severity")

        if category:
            qs = qs.filter(category=category)
        if status_param:
            qs = qs.filter(status=status_param)
        if severity:
            qs = qs.filter(severity=severity)

        return qs

    def get_serializer_context(self):
        return {"request": self.request}


class ReportDetailView(generics.RetrieveAPIView):
    """GET /api/reports/{id}/ -- public, full detail incl. status history."""
    serializer_class = ReportDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Report.objects.annotate(upvote_count=Count("upvotes")).prefetch_related("status_updates")

    def get_serializer_context(self):
        return {"request": self.request}


class UpvoteToggleView(APIView):
    """
    POST /api/reports/{id}/upvote/ -- auth required.
    Toggles the upvote: creates it if absent, removes it if already upvoted.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({"detail": "Report not found."}, status=http_status.HTTP_404_NOT_FOUND)

        upvote, created = Upvote.objects.get_or_create(report=report, user=request.user)
        if not created:
            upvote.delete()
            upvoted = False
        else:
            upvoted = True

        count = Upvote.objects.filter(report=report).count()
        return Response({"upvoted": upvoted, "upvote_count": count})


class ReportStatusUpdateView(APIView):
    """
    PATCH /api/reports/{id}/status/ -- Officer only.
    Body: { "status": "in_progress" | "resolved" | "rejected", "note": "..." }
    Creates a StatusUpdate audit record and updates Report.status atomically.
    """
    permission_classes = [IsOfficer]

    VALID_TRANSITIONS = {
        "pending": {"in_progress", "rejected"},
        "in_progress": {"resolved", "rejected"},
        "resolved": set(),
        "rejected": set(),
    }

    def patch(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({"detail": "Report not found."}, status=http_status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        note = request.data.get("note", "")

        valid_choices = dict(Report.STATUS_CHOICES)
        if new_status not in valid_choices:
            return Response({"detail": f"Invalid status. Choose from {list(valid_choices)}."},
                             status=http_status.HTTP_400_BAD_REQUEST)

        allowed_next = self.VALID_TRANSITIONS.get(report.status, set())
        if new_status not in allowed_next:
            return Response(
                {"detail": f"Cannot move from '{report.status}' to '{new_status}'."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        old_status = report.status
        report.status = new_status
        report.save(update_fields=["status", "updated_at"])

        report.status_updates.create(
            old_status=old_status,
            new_status=new_status,
            note=note,
            updated_by=request.user,
        )

        return Response({
            "id": report.id,
            "old_status": old_status,
            "new_status": new_status,
            "note": note,
        })