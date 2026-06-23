from rest_framework import serializers
from .models import Roadmap, Milestone

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ['id', 'title', 'description', 'order', 'estimated_duration', 'is_completed', 'resources']
        read_only_fields = ['id', 'order']

class RoadmapSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    total_milestones = serializers.SerializerMethodField()
    completed_milestones = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Roadmap
        fields = ['id', 'title', 'description', 'career_field', 'created_at', 'milestones', 'total_milestones', 'completed_milestones', 'progress_percentage']

    def get_total_milestones(self, obj):
        return obj.milestones.count()

    def get_completed_milestones(self, obj):
        return obj.milestones.filter(is_completed=True).count()

    def get_progress_percentage(self, obj):
        total = obj.milestones.count()
        if total == 0:
            return 0
        completed = obj.milestones.filter(is_completed=True).count()
        return int((completed / total) * 100)
