from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import Application
from .serializers import ApplicationSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all().order_by("-created_at")
    serializer_class = ApplicationSerializer

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        counts = Application.objects.values("status").annotate(count=Count("id"))
        result = {c[0]: 0 for c in Application.STATUS_CHOICES}
        for row in counts:
            result[row["status"]] = row["count"]
        return Response(result)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        obj = self.get_object()
        new_status = request.data.get("status")
        allowed = {c[0] for c in Application.STATUS_CHOICES}
        if new_status not in allowed:
            return Response({"error": "Invalid status"}, status=http_status.HTTP_400_BAD_REQUEST)

        obj.status = new_status
        obj.save()
        return Response(ApplicationSerializer(obj).data)

