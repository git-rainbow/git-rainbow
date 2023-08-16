from django.urls import path
from apps.group import views

urlpatterns = [
    path('group/list', views.group_list),
    path('group/new', views.create_group),
    path('group/<int:group_id>', views.group)
]
