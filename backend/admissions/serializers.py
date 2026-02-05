import os
from rest_framework import serializers
from .models import Application

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png"}
ALLOWED_DOC_EXTS = {".pdf", ".doc", ".docx"}

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = "__all__"

    def validate_image(self, file):
        if not file:
            return file
        ext = os.path.splitext(file.name.lower())[1]
        if ext not in ALLOWED_IMAGE_EXTS:
            raise serializers.ValidationError("Image must be .jpg, .jpeg, or .png")
        return file

    def validate_document(self, file):
        if not file:
            return file
        ext = os.path.splitext(file.name.lower())[1]
        if ext not in ALLOWED_DOC_EXTS:
            raise serializers.ValidationError("Document must be .pdf, .doc, or .docx")
        return file
