import json
from django.db import transaction
from django.conf import settings
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decouple import config

from google import genai

from accounts.permissions import IsStudent
from accounts.models import StudentProfile
from .models import Roadmap, Milestone
from .serializers import RoadmapSerializer

class RoadmapGenerateView(views.APIView):
    permission_classes = [IsStudent]

    def post(self, request):
        student = request.user
        try:
            profile = student.student_profile
        except StudentProfile.DoesNotExist:
            return Response(
                {"error": "Please complete your student profile before generating a roadmap."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate that the student has filled minimal profile details
        if not profile.grade or not profile.skills or len(profile.skills) == 0:
            return Response(
                {"error": "Please fill in your Grade and select at least one Skill in your profile before generating a roadmap."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if roadmap already exists
        existing_roadmap = Roadmap.objects.filter(student=student).first()
        if existing_roadmap:
            return Response(
                {"error": "Roadmap already exists. Use the regenerate/delete endpoint to create a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate roadmap via Gemini AI
        gemini_api_key = config('GEMINI_API_KEY', default='')
        model_name = config('GEMINI_MODEL', default='gemini-2.0-flash')
        
        prompt = f"""
You are an expert career counsellor. Based on the student's profile data below, generate a highly personalized career roadmap with exactly 8 to 10 milestones.
Student Profile:
- Grade: {profile.grade}
- Date of Birth: {profile.dob if profile.dob else 'Not specified'}
- School Name: {profile.school_name if profile.school_name else 'Not specified'}
- Interests: {profile.interests if profile.interests else 'Not specified'}
- Strengths: {profile.strengths if profile.strengths else 'Not specified'}
- Career Goals: {profile.goals if profile.goals else 'Not specified'}
- Preferred Career Fields: {profile.preferred_career_fields if profile.preferred_career_fields else 'Not specified'}
- Selected Skills: {", ".join(profile.skills)}

You MUST respond ONLY with a valid JSON object matching this exact schema. Do not include any explanation, intro, or markdown fences (like ```json). Just the raw JSON object.
JSON Schema:
{{
  "title": "A catchy and professional title for the roadmap",
  "description": "A high-level overview of the career roadmap, detailing how it aligns with the student's skills and interests",
  "career_field": "The primary career field this roadmap focuses on",
  "milestones": [
    {{
      "title": "Milestone Title (e.g. Learn Basics of Python)",
      "description": "Specific objectives and what needs to be achieved in this milestone",
      "estimated_duration": "Duration (e.g. 3 weeks, 2 months)",
      "resources": "Suggested free books, websites, online courses, or projects (comma-separated list)",
      "order": 1
    }}
  ]
}}
Ensure the milestones are in sequential order from order 1 to order N (where N is between 8 and 10).
"""

        # Retry loop for parsing JSON
        max_retries = 3
        roadmap_data = None
        
        for attempt in range(max_retries):
            try:
                # Support mock mode for testing without an API key
                if model_name == 'mock' or not gemini_api_key or gemini_api_key == 'YOUR_GEMINI_API_KEY_HERE':
                    raise Exception("Gemini API key not configured, using fallback")
                
                # Initialize Gemini client and generate content
                client = genai.Client(api_key=gemini_api_key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                    }
                )
                
                content_str = response.text.strip()
                
                # Clean up any potential markdown fences
                if content_str.startswith("```"):
                    content_str = content_str.split("\n", 1)[-1]
                    if content_str.endswith("```"):
                        content_str = content_str.rsplit("```", 1)[0]
                content_str = content_str.strip()
                
                parsed_json = json.loads(content_str)
                
                # Validate shape
                if 'title' in parsed_json and 'career_field' in parsed_json and 'milestones' in parsed_json:
                    if isinstance(parsed_json['milestones'], list) and len(parsed_json['milestones']) >= 8:
                        roadmap_data = parsed_json
                        break
            except Exception as e:
                import traceback
                print(f"[GEMINI ERROR] Roadmap generation attempt {attempt + 1} failed: {type(e).__name__}: {e}")
                traceback.print_exc()
                
        # If AI generation failed after retries, create a structured fallback/mock roadmap so the user has a functioning app
        if not roadmap_data:
            print("Falling back to pre-defined roadmap generator...")
            # Fallback to local deterministic generator if Gemini is not configured or offline
            skills_str = ", ".join(profile.skills)
            career = profile.preferred_career_fields if profile.preferred_career_fields else "General Professional"
            roadmap_data = {
                "title": f"Custom Roadmap for {career}",
                "description": f"A targeted roadmap created based on your skills in {skills_str} and interests in {profile.interests}.",
                "career_field": career,
                "milestones": [
                    {
                        "title": f"Explore Foundations of {career}",
                        "description": f"Research the basic roles, key players, and core requirements of the {career} field.",
                        "estimated_duration": "2 weeks",
                        "resources": "YouTube, Career portals, Wikipedia",
                        "order": 1
                    },
                    {
                        "title": f"Develop Core Technical Skills",
                        "description": f"Focus on developing skills: {skills_str}. Seek introductory online courses or projects.",
                        "estimated_duration": "4 weeks",
                        "resources": "Coursera, edX, Khan Academy",
                        "order": 2
                    },
                    {
                        "title": "Build a Personal Project",
                        "description": "Apply your learning by creating a small portfolio project related to your goals.",
                        "estimated_duration": "3 weeks",
                        "resources": "GitHub, Google search, Medium tutorials",
                        "order": 3
                    },
                    {
                        "title": "Join Professional Communities",
                        "description": "Connect with peers and mentors in local or online forums.",
                        "estimated_duration": "1 week",
                        "resources": "LinkedIn, Discord groups, Reddit",
                        "order": 4
                    },
                    {
                        "title": "Advance Technical Proficiency",
                        "description": "Take intermediate-level courses or workshops to deepen knowledge in your field.",
                        "estimated_duration": "6 weeks",
                        "resources": "FreeCodeCamp, Udemy, specialized textbooks",
                        "order": 5
                    },
                    {
                        "title": "Engage with a Career Mentor",
                        "description": "Book a session with a mentor on Samarthya AI to review your progress and plans.",
                        "estimated_duration": "1 week",
                        "resources": "Samarthya AI Mentor platform",
                        "order": 6
                    },
                    {
                        "title": "Acquire Certification or Credentials",
                        "description": "Prepare for and take a recognized certification exam to validate your skills.",
                        "estimated_duration": "4 weeks",
                        "resources": "Industry certifications, Coursera certs",
                        "order": 7
                    },
                    {
                        "title": "Create Professional Resume & Portfolio",
                        "description": "Document your projects, credentials, and achievements in a professional resume and portfolio website.",
                        "estimated_duration": "2 weeks",
                        "resources": "Canva, GitHub Pages, Google Sites",
                        "order": 8
                    }
                ]
            }

        # Override description with personalized message using the student's name
        student_name = f"{student.first_name} {student.last_name}".strip() or student.email
        roadmap_data['description'] = f"This is the personalised roadmap for '{student_name}'"

        # Save to database in a transaction (ensures atomic all-or-nothing save)
        try:
            with transaction.atomic():
                roadmap = Roadmap.objects.create(
                    student=student,
                    title=roadmap_data['title'],
                    description=roadmap_data['description'],
                    career_field=roadmap_data['career_field']
                )
                
                milestones_to_create = []
                for ms in roadmap_data['milestones']:
                    milestones_to_create.append(
                        Milestone(
                            roadmap=roadmap,
                            title=ms['title'],
                            description=ms.get('description', ''),
                            order=ms['order'],
                            estimated_duration=ms.get('estimated_duration', ''),
                            resources=ms.get('resources', ''),
                            is_completed=False
                        )
                    )
                Milestone.objects.bulk_create(milestones_to_create)
                
            return Response(RoadmapSerializer(roadmap).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": f"Failed to save the roadmap. Database error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RoadmapDetailView(views.APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        roadmap = Roadmap.objects.filter(student=request.user).first()
        if not roadmap:
            return Response({"detail": "No roadmap found for this user."}, status=status.HTTP_404_NOT_FOUND)
        serializer = RoadmapSerializer(roadmap)
        return Response(serializer.data)

class MilestoneCompleteView(views.APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            milestone = Milestone.objects.get(id=pk, roadmap__student=request.user)
            milestone.is_completed = not milestone.is_completed
            milestone.save()
            
            roadmap = milestone.roadmap
            serializer = RoadmapSerializer(roadmap)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Milestone.DoesNotExist:
            return Response({"error": "Milestone not found."}, status=status.HTTP_404_NOT_FOUND)

class RoadmapRegenerateView(views.APIView):
    permission_classes = [IsStudent]

    def delete(self, request):
        roadmap = Roadmap.objects.filter(student=request.user).first()
        if not roadmap:
            return Response({"error": "No roadmap exists to regenerate."}, status=status.HTTP_404_NOT_FOUND)
        
        # Delete existing roadmap (milestones will be cascade-deleted)
        roadmap.delete()
        
        # Trigger generation logic
        generate_view = RoadmapGenerateView()
        return generate_view.post(request)
