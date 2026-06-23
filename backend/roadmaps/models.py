from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Roadmap(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='roadmap')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    career_field = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Roadmap for {self.student.email} - {self.title}"

class Milestone(models.Model):
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    order = models.IntegerField()
    estimated_duration = models.CharField(max_length=100, blank=True, default='')
    is_completed = models.BooleanField(default=False)
    resources = models.TextField(blank=True, default='') # suggested resources

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.roadmap.student.email} - M{self.order}: {self.title}"
