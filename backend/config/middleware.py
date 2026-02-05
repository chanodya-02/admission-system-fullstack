from django.http import JsonResponse
from django.conf import settings

ADMIN_ONLY_PATHS = [
    "/api/applications/summary/",
]

def admin_key_middleware(get_response):
    def middleware(request):
        path = request.path

        # Protect admin-only endpoints + admin actions
        if path.startswith("/api/applications/") and request.method in ["PATCH", "PUT", "DELETE"]:
            key = request.headers.get("X-ADMIN-KEY", "")
            if not settings.ADMIN_API_KEY or key != settings.ADMIN_API_KEY:
                return JsonResponse({"detail": "Admin key required"}, status=403)

        if path in ADMIN_ONLY_PATHS:
            key = request.headers.get("X-ADMIN-KEY", "")
            if not settings.ADMIN_API_KEY or key != settings.ADMIN_API_KEY:
                return JsonResponse({"detail": "Admin key required"}, status=403)

        return get_response(request)
    return middleware
