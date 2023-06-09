import json

from django.http import JsonResponse
from django.shortcuts import render

from apps.tech_stack.models import TechName


def admin_tech_stack_list_page(request):
    tech_list = TechName.objects.all().order_by('tech_name')
    return render(request, 'admin/admin_tech_list.html', {'tech_list': tech_list})


def admin_tech_list_manage(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'not allowed method'})
    allowed_actions = ['create', 'update', 'delete']
    action = request.POST.get('action')
    if not action or action not in allowed_actions:
        return JsonResponse({'status': 'not allowed action'})

    if action == 'create':
        tech_name = request.POST.get('tech_name')
        tech_type = request.POST.get('tech_type')
        tech_name_obj, created = TechName.objects.get_or_create(tech_name=tech_name, defaults={'tech_type': tech_type})
        if not created:
            JsonResponse({'status': 'existing tech name'})
    elif action == 'update':
        update_tech_date_list = json.loads(request.POST.get('update_tech_date_list'))
        for update_data in update_tech_date_list:
            update_techname = TechName.objects.get(tech_name=update_data['tech_name'])
            update_techname.tech_files_lists = update_data['tech_files_lists']
            update_techname.tech_files_keywords_lists = update_data['tech_files_keywords_lists']
            update_techname.ext_lists = update_data['ext_lists']
            update_techname.include_filter = update_data['include_filter']
            update_techname.keyword_lists = update_data['keyword_lists']
            update_techname.package_list = update_data['package_list']
            update_techname.is_special_tech_files = update_data['is_special_tech_files']
            update_techname.save()
    elif action == 'delete':
        delete_tech_list = json.loads(request.POST.get('delete_tech_list'))
        delete_tech_obj = TechName.objects.filter(tech_name__in=delete_tech_list)
        delete_tech_obj.delete()
    return JsonResponse({'status': 'success'})
