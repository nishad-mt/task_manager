from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView,SignupView
from django.urls import path


urlpatterns = [
    path('signup/',SignupView.as_view(), name='signup'),
    path('login/',LoginView.as_view(), name='login'),
    ]