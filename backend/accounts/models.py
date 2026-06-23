from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('mentor', 'Mentor'),
        ('admin', 'Admin'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_verified = models.BooleanField(default=False)
    
    objects = UserManager()

    REQUIRED_FIELDS = ['role']
    USERNAME_FIELD = 'email'

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.role})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    grade = models.IntegerField(choices=[(i, str(i)) for i in range(8, 13)], null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    school_name = models.CharField(max_length=255, blank=True, default='')
    interests = models.TextField(blank=True, default='')
    strengths = models.TextField(blank=True, default='')
    goals = models.TextField(blank=True, default='')
    preferred_career_fields = models.TextField(blank=True, default='')
    skills = models.JSONField(default=list, blank=True) # predefined tags: Coding, Public Speaking, Writing, Math, Design, Leadership, Research, Problem Solving, Teamwork, Creativity
    
    @property
    def completion_percentage(self):
        fields = [self.grade, self.dob, self.school_name, self.interests, self.strengths, self.goals, self.preferred_career_fields, self.skills]
        filled = 0
        for f in fields:
            if isinstance(f, list):
                if len(f) > 0:
                    filled += 1
            elif f is not None and f != '':
                filled += 1
        return int((filled / len(fields)) * 100)

    def __str__(self):
        return f"Student: {self.user.email}"


class MentorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    specialization = models.CharField(max_length=255, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    experience_years = models.IntegerField(null=True, blank=True)
    education = models.TextField(blank=True, default='')
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # Hourly rate in INR
    is_verified = models.BooleanField(default=False) # only editable by Admin

    def __str__(self):
        return f"Mentor: {self.user.email} (Verified: {self.is_verified})"
