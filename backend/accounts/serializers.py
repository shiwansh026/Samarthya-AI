from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, StudentProfile, MentorProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = StudentProfile
        fields = [
            'grade', 'dob', 'school_name', 'interests', 
            'strengths', 'goals', 'preferred_career_fields', 
            'skills', 'completion_percentage'
        ]

class MentorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorProfile
        fields = [
            'specialization', 'bio', 'experience_years', 
            'education', 'hourly_rate', 'is_verified'
        ]
        read_only_fields = ['is_verified']

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'is_active', 'profile']
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'is_active']

    def get_profile(self, obj):
        if obj.role == 'student':
            profile_obj, _ = StudentProfile.objects.get_or_create(user=obj)
            return StudentProfileSerializer(profile_obj).data
        elif obj.role == 'mentor':
            profile_obj, _ = MentorProfile.objects.get_or_create(user=obj)
            return MentorProfileSerializer(profile_obj).data
        return None

class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password', 'role']
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
            'password': {'write_only': True},
            'role': {'required': True}
        }

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Backend-enforced password length & strength check
        validate_password(data['password'])
        
        if data['role'] not in ['student', 'mentor']:
            raise serializers.ValidationError({"role": "Invalid role selected. Must be 'student' or 'mentor'."})
            
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Determine is_verified (False by default for email signup)
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role'],
            is_verified=False,
            is_active=True
        )
        
        # Create corresponding profile
        if user.role == 'student':
            StudentProfile.objects.create(user=user)
        elif user.role == 'mentor':
            MentorProfile.objects.create(user=user)
            
        return user
