from django.shortcuts import render
from django.http import JsonResponse
from django.template import loader
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from apps.tech_stack.models import GithubUser, TechStackFile
from apps.tech_stack.utils import make_tech_card_data, make_calendar_data
from config.local_settings import token_list
from utils.core_func.core_func import core_repo_list
from utils.github_api import request_github_profile


def main_page(request):
    return render(request, 'index.html')


def loading_page(request, github_id):
    context = {'github_id': github_id}
    if GithubUser.objects.filter(github_id=github_id).exists and request.GET.get('update') != 'true':
        return render(request, 'loading.html', context)

    for index in range(len(token_list)):
        github_data = request_github_profile(github_id, token_list[index])
        if github_data['status'] == "success":
            break

        if len(token_list)-1 == index and github_data['result'] == 'token error':
            return JsonResponse({'status': 'fail', 'reason': 'token error'})

    if github_data['status'] == 'fail' or github_data['result'] == 'no user':
        return JsonResponse({'status': 'fail', 'reason': github_data['result']})

    github_data = github_data['result']

    GithubUser.objects.update_or_create(
        github_id=github_id,
        defaults={**github_data, 'status':'requested'}
    )

    user_data = {"github_id": github_id, "after": "", "tech_stack": True}
    core_repo_list(user_data)
    return render(request, 'loading.html', context)


def analyze_page(request):
    if request.method != 'POST':
        return JsonResponse({"status":"Not allowed method"})
    github_id = request.POST.get('github_id')
    github_user = GithubUser.objects.filter(github_id=github_id).first()
    if not github_user:
        return JsonResponse({"status":"no github user in DB"})

    user_status = github_user.status
    if user_status == 'fail':
        return JsonResponse({"status":"fail"})
    if user_status == 'requested' or user_status == 'progress':
        return JsonResponse({"status":user_status})
    
    # data for calendar
    today = timezone.now()
    tech_files = TechStackFile.objects.filter(github_id_id=github_id, author_date__range=[today - relativedelta(years=1), today])
    tech_card_data = make_tech_card_data(tech_files)
    calendar_data = make_calendar_data(tech_files)

    context = {'github_user':github_user, 'tech_card_data': tech_card_data,}
    json_data = {
        'status': user_status,
        'calendar_data': calendar_data
    }
    content = loader.render_to_string(
        'git_analysis.html',
        context,
        request
    )
    return JsonResponse({"content": content, **json_data})
