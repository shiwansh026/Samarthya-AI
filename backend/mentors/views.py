from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from accounts.permissions import IsStudent, IsMentor
from accounts.models import MentorProfile
from .models import Session
from .serializers import MentorDiscoverSerializer, SessionSerializer

User = get_user_model()

class MentorListView(generics.ListAPIView):
    permission_classes = [IsStudent]
    serializer_class = MentorDiscoverSerializer

    def get_queryset(self):
        # Only verified mentors can be discovered by students
        return MentorProfile.objects.filter(is_verified=True)

class MentorDetailView(generics.RetrieveAPIView):
    permission_classes = [IsStudent]
    serializer_class = MentorDiscoverSerializer
    queryset = MentorProfile.objects.filter(is_verified=True)
    lookup_field = 'user_id' # search by User's ID (since mentor_id matches user_id in OneToOne relation)

class BookSessionView(generics.CreateAPIView):
    permission_classes = [IsStudent]
    serializer_class = SessionSerializer

    def perform_create(self, serializer):
        # Assign current authenticated student to the session
        serializer.save(
            student=self.request.user,
            status='pending',
            payment_status='not_required'
        )

class SessionListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'student':
            sessions = Session.objects.filter(student=user).order_by('-scheduled_date')
        elif user.role == 'mentor':
            sessions = Session.objects.filter(mentor=user).order_by('-scheduled_date')
        else:
            return Response({"error": "Admin role does not have counselling sessions."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SessionSerializer(sessions, many=True)
        return Response(serializer.data)

class SessionConfirmView(views.APIView):
    permission_classes = [IsMentor]

    def patch(self, request, pk):
        try:
            session = Session.objects.get(id=pk, mentor=request.user)
            if session.status != 'pending':
                return Response(
                    {"error": f"Cannot confirm session in {session.status} status."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            session.status = 'confirmed'
            session.save()
            return Response(SessionSerializer(session).data)
        except Session.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

class SessionCancelView(views.APIView):
    permission_classes = [IsMentor]

    def patch(self, request, pk):
        try:
            session = Session.objects.get(id=pk, mentor=request.user)
            if session.status not in ['pending', 'confirmed']:
                return Response(
                    {"error": f"Cannot cancel session in {session.status} status."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            session.status = 'cancelled'
            session.save()
            return Response(SessionSerializer(session).data)
        except Session.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

class SessionCompleteView(views.APIView):
    permission_classes = [IsMentor]

    def patch(self, request, pk):
        try:
            session = Session.objects.get(id=pk, mentor=request.user)
            if session.status != 'confirmed':
                return Response(
                    {"error": "Only confirmed sessions can be marked as completed."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            session.status = 'completed'
            session.save()
            return Response(SessionSerializer(session).data)
        except Session.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)
