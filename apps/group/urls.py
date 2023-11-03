from django.urls import path
from apps.group import views

urlpatterns = [
    path('group/info', views.group_info),
    path('group/list', views.group_list),
    path('group/refresh-img', views.refresh_img),
    path('group/new', views.create_group),
    path('group/<int:group_id>', views.group),
    path('group/<int:group_id>/update', views.group_update),
    path('group/<int:group_id>/join', views.group_join),
    path('group/<int:group_id>/remove', views.remove_group),
    path('group/<int:group_id>/get-out', views.get_out_group),
    path('group/<int:group_id>/save/repo', views.update_group_repo),
    path('group/<int:group_id>/delete/repo', views.delete_group_repo),
    path('group/graph-data', views.group_graph),
    path('group/kick-out-members', views.kick_out_members),
]
