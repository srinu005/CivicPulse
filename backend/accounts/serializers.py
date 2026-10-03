from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import OfficerProfile


class RegisterSerializer(serializers.ModelSerializer):
    """Public citizen self-registration. This is the ONLY open signup path."""

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class OfficerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficerProfile
        fields = ["designation", "department", "jurisdiction_area", "official_email"]


class UserSerializer(serializers.ModelSerializer):
    """Returned by /api/me/. Includes role + officer profile if present."""

    role = serializers.SerializerMethodField()
    officer_profile = OfficerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "officer_profile"]

    def get_role(self, obj):
        if obj.is_staff:
            return "admin"
        if hasattr(obj, "officer_profile"):
            return "officer"
        return "citizen"


class OfficerListSerializer(serializers.ModelSerializer):
    """Used for GET /api/officers/ -- Super Admin's view of all provisioned officers."""

    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = OfficerProfile
        fields = ["id", "username", "email", "is_active", "designation", "department", "jurisdiction_area", "official_email", "created_at"]


class OfficerCreateSerializer(serializers.Serializer):
    """
    Used by the Super-Admin-only officer provisioning endpoint.
    Creates the User AND its OfficerProfile together, atomically.
    """

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    designation = serializers.ChoiceField(choices=OfficerProfile.DESIGNATION_CHOICES)
    department = serializers.CharField(max_length=150)
    jurisdiction_area = serializers.CharField(max_length=150)
    official_email = serializers.EmailField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_official_email(self, value):
        if OfficerProfile.objects.filter(official_email=value).exists():
            raise serializers.ValidationError("Official email already registered.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        officer_profile = OfficerProfile.objects.create(
            user=user,
            designation=validated_data["designation"],
            department=validated_data["department"],
            jurisdiction_area=validated_data["jurisdiction_area"],
            official_email=validated_data["official_email"],
        )
        return officer_profile

    def to_representation(self, instance):
        # `instance` here is the OfficerProfile created above -- username/email
        # live on the related User, not on OfficerProfile itself, so we build
        # the response explicitly instead of relying on field auto-lookup.
        return {
            "id": instance.user.id,
            "username": instance.user.username,
            "email": instance.user.email,
            "designation": instance.designation,
            "department": instance.department,
            "jurisdiction_area": instance.jurisdiction_area,
            "official_email": instance.official_email,
        }