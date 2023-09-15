from django.urls import path
from apps.search import views

urlpatterns = [
    path('search/repos', views.search_repo),
]
