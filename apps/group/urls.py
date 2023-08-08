from django.urls import path
from apps.group import views

urlpatterns = [
    path('group/list', views.group_list)
]
