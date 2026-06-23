from rest_framework import serializers
from django.contrib.auth import get_user_model
from accounts.models import MentorProfile
from accounts.serializers import UserSerializer
from .models import Session

User = get_user_model()

class MentorDiscoverSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = MentorProfile
        fields = ['id', 'user_details', 'specialization', 'bio', 'experience_years', 'education', 'hourly_rate', 'is_verified']

class SessionSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField(read_only=True)
    mentor_email = serializers.EmailField(source='mentor.email', read_only=True)
    mentor_name = serializers.SerializerMethodField(read_only=True)
    mentor_specialization = serializers.CharField(source='mentor.mentor_profile.specialization', read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'student', 'student_email', 'student_name', 
            'mentor', 'mentor_email', 'mentor_name', 'mentor_specialization',
            'scheduled_date', 'topic', 'description', 'status', 'payment_status', 'created_at'
        ]
        read_only_fields = ['id', 'student', 'status', 'payment_status', 'created_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_mentor_name(self, obj):
        return f"{obj.mentor.first_name} {obj.mentor.last_name}"

    def validate_mentor(self, value):
        # Must be a mentor and verified
        if value.role != 'mentor':
            raise serializers.ValidationError("Selected user is not a mentor.")
        if not hasattr(value, 'mentor_profile') or not value.mentor_profile.is_verified:
            raise serializers.ValidationError("Selected mentor is not verified by administration.")
        return value
