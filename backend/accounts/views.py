from django.shortcuts import render, redirect
from django.core import signing
from django.core.mail import send_mail
from django.conf import settings
from decouple import config
from rest_framework import status, generics, views, serializers
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, StudentProfile, MentorProfile
from .serializers import RegisterSerializer, UserSerializer, StudentProfileSerializer, MentorProfileSerializer
from .permissions import IsStudent, IsMentor, IsAdmin

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

def send_verification_email(user):
    token = signing.dumps({'user_id': user.id}, salt='email-verify')
    verify_url = f"http://localhost:8000/api/auth/verify-email/{token}/"
    subject = "Verify your email - Samarthya AI"
    message = f"Hello {user.first_name},\n\nPlease verify your email by clicking the link below:\n{verify_url}\n\nThank you,\nSamarthya AI Team"
    # Prints to terminal because settings.EMAIL_BACKEND is console
    send_mail(
        subject, 
        message, 
        'noreply@samarthya.ai', 
        [user.email],
        fail_silently=False
    )

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Default validation to authenticate user credentials
        data = super().validate(attrs)
        
        # Check if the user is verified
        if not self.user.is_verified:
            raise serializers.ValidationError({
                "detail": "Your email address is not verified. Please check your email for the verification link."
            })
            
        # Check if the user is active
        if not self.user.is_active:
            raise serializers.ValidationError({
                "detail": "Your account has been deactivated/blocked by an administrator."
            })
            
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send verification email
        try:
            send_verification_email(user)
        except Exception as e:
            # log email failure, don't fail registration for local dev
            print("Failed to send verification email:", e)
            
        return Response({
            "message": "Registration successful. Please check your console terminal for the email verification link.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class VerifyEmailView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            # Token valid for 24 hours
            data = signing.loads(token, salt='email-verify', max_age=86400)
            user_id = data['user_id']
            user = User.objects.get(id=user_id)
            if not user.is_verified:
                user.is_verified = True
                user.save()
            # Redirect to frontend login page
            frontend_url = settings.FRONTEND_URL
            return redirect(f"{frontend_url}/?verified=true")
        except (signing.SignatureExpired, signing.BadSignature, User.DoesNotExist) as e:
            # Redirect to frontend with error parameter
            frontend_url = settings.FRONTEND_URL
            return redirect(f"{frontend_url}/?verified=false&error=invalid_token")

    def post(self, request, token):
        try:
            data = signing.loads(token, salt='email-verify', max_age=86400)
            user_id = data['user_id']
            user = User.objects.get(id=user_id)
            if not user.is_verified:
                user.is_verified = True
                user.save()
            return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)
        except (signing.SignatureExpired, signing.BadSignature, User.DoesNotExist):
            return Response({"error": "Invalid or expired verification token."}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class StudentProfileUpdateView(generics.UpdateAPIView):
    permission_classes = [IsStudent]
    serializer_class = StudentProfileSerializer

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile

class MentorProfileUpdateView(generics.UpdateAPIView):
    permission_classes = [IsMentor]
    serializer_class = MentorProfileSerializer

    def get_object(self):
        profile, _ = MentorProfile.objects.get_or_create(user=self.request.user)
        return profile

class GoogleLoginView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Handles token verification from Google Login/Signup.
        Query params: ?credential=TOKEN&role=student|mentor
        """
        credential = request.query_params.get('credential')
        role = request.query_params.get('role', 'student')
        
        if not credential:
            # For quick testing, mock Google OAuth if credential is 'mock-oauth-student' or 'mock-oauth-mentor'
            mock_role = request.query_params.get('mock_role')
            if mock_role in ['student', 'mentor']:
                mock_email = f"mock_{mock_role}@gmail.com"
                user, created = User.objects.get_or_create(
                    email=mock_email,
                    defaults={
                        'first_name': 'Mock',
                        'last_name': mock_role.capitalize(),
                        'role': mock_role,
                        'is_verified': True,
                        'is_active': True
                    }
                )
                if created:
                    if mock_role == 'student':
                        StudentProfile.objects.get_or_create(user=user)
                    else:
                        MentorProfile.objects.get_or_create(user=user)
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data
                })
            
            return Response({"error": "Credential token is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            client_id = config('GOOGLE_CLIENT_ID', default='')
            # Verify the token with Google's servers
            # Since local test client IDs may not be verified in testing, we catch exceptions
            idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
            
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            # Check if user exists
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': role,
                    'is_verified': True, # auto-verified from Google
                    'is_active': True
                }
            )
            
            # Setup profile if new
            if created:
                if role == 'student':
                    StudentProfile.objects.get_or_create(user=user)
                elif role == 'mentor':
                    MentorProfile.objects.get_or_create(user=user)
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
            
        except Exception as e:
            return Response({"error": f"Google authentication failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.exclude(role='admin') # list students and mentors only

class AdminVerifyMentorView(views.APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            mentor_user = User.objects.get(id=pk, role='mentor')
            profile, _ = MentorProfile.objects.get_or_create(user=mentor_user)
            profile.is_verified = True
            profile.save()
            return Response({"message": f"Mentor {mentor_user.email} verified successfully."})
        except User.DoesNotExist:
            return Response({"error": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)

class AdminToggleActiveView(views.APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(id=pk)
            if user.role == 'admin':
                return Response({"error": "Cannot toggle active status of admins."}, status=status.HTTP_400_BAD_REQUEST)
            user.is_active = not user.is_active
            user.save()
            status_str = "activated" if user.is_active else "blocked"
            return Response({"message": f"User account has been {status_str}."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
