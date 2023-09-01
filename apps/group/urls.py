from django.urls import path
from apps.group import views

urlpatterns = [
    path('group/list', views.group_list),
    path('group/refresh-img', views.refresh_img),
    path('group/new', views.create_group),
    path('group/<int:group_id>', views.group),
    path('group/update', views.group_update),
    path('group/join', views.group_join),
    path('group/graph-data', views.group_graph)
]
