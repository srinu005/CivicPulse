from django.urls import path
from .views import ReportListCreateView, ReportDetailView, UpvoteToggleView, ReportStatusUpdateView

urlpatterns = [
    path("reports/", ReportListCreateView.as_view(), name="report-list-create"),
    path("reports/<int:pk>/", ReportDetailView.as_view(), name="report-detail"),
    path("reports/<int:pk>/upvote/", UpvoteToggleView.as_view(), name="report-upvote"),
    path("reports/<int:pk>/status/", ReportStatusUpdateView.as_view(), name="report-status-update"),
]