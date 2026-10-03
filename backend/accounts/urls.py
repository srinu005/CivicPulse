from django.urls import path
from .views import RegisterView, MeView, OfficerListCreateView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("officers/", OfficerListCreateView.as_view(), name="officer-list-create"),
]