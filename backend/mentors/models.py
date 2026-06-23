from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Session(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_sessions')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentor_sessions')
    scheduled_date = models.DateTimeField()
    topic = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, default='not_required')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session: {self.student.email} with {self.mentor.email} on {self.scheduled_date} ({self.status})"
