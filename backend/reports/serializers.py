from rest_framework import serializers
from .models import Report, StatusUpdate, Upvote


class ReportCreateSerializer(serializers.ModelSerializer):
    """Used for POST /api/reports/ -- citizen submits a new report."""

    class Meta:
        model = Report
        fields = [
            "id", "category", "description", "photo",
            "latitude", "longitude", "address", "severity",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        # user comes from the authenticated request, never from client input
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ReportListSerializer(serializers.ModelSerializer):
    """Used for GET /api/reports/ -- lightweight, for map/list views."""

    upvote_count = serializers.IntegerField(read_only=True)
    reporter = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id", "category", "severity", "status",
            "latitude", "longitude", "address",
            "upvote_count", "reporter", "created_at",
        ]


class StatusUpdateSerializer(serializers.ModelSerializer):
    updated_by = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = StatusUpdate
        fields = ["old_status", "new_status", "note", "updated_by", "timestamp"]


class ReportDetailSerializer(serializers.ModelSerializer):
    """Used for GET /api/reports/{id}/ -- full detail incl. history."""

    upvote_count = serializers.IntegerField(read_only=True)
    reporter = serializers.CharField(source="user.username", read_only=True)
    status_updates = StatusUpdateSerializer(many=True, read_only=True)
    user_has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id", "category", "description", "photo", "severity", "status",
            "latitude", "longitude", "address",
            "upvote_count", "user_has_upvoted", "reporter",
            "status_updates", "created_at", "updated_at",
        ]

    def get_user_has_upvoted(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return Upvote.objects.filter(report=obj, user=request.user).exists()