from django.db import models

class Application(models.Model):
    STATUS_CHOICES = [
        ("PROCESSING", "Processing"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    ]

    GENDER_CHOICES = [
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHER", "Other"),
    ]

    grade_level = models.CharField(max_length=20)
    applicant_name = models.CharField(max_length=200)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    activities = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PROCESSING")

    image = models.ImageField(upload_to="images/", null=True, blank=True)
    document = models.FileField(upload_to="docs/", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.applicant_name} - {self.grade_level} ({self.status})"
