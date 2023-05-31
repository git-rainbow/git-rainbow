from django.urls import path
from . import views


urlpatterns = [
    path('login/github', views.github_login),
    path('login/github/callback', views.github_callback),
    path('logout', views.logout),
]
