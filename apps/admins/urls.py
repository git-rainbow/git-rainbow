from django.urls import path
from . import views


urlpatterns = [
    path('tech-list', views.admin_tech_stack_list_page),
    path('tech-list/edit', views.admin_tech_list_manage),
]
