import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template import loader
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from apps.tech_stack.models import GithubUser, TechStackFile, AnalysisData
from apps.tech_stack.utils import make_tech_card_data, make_calendar_data
from config.local_settings import token_list
from utils.core_func.core_func import core_repo_list
from utils.github_api import request_github_profile
from utils.git_analysis.calendar import git_calendar_colors
from utils.github_calendar.github_calendar import generate_github_calendar


def exception_view(request, exception=None):
    status = 404
    context = {'error': status, 'message': 'Page not found. Check the address or'}
    if exception is None:
        status = 500
        context = {'error': status, 'message': 'Server error'}
    return render(request, 'exception_page.html', context, status=status)


def main_page(request):
    return render(request, 'index.html')


def update_or_create_github_user(github_id):
    for index in range(len(token_list)):
        github_data, github_id = request_github_profile(github_id, token_list[index])
        if github_data['status'] == "success":
            break

        if len(token_list)-1 == index and github_data['result'] == 'token error':
            return {'status': 'fail', 'reason': 'token error'}

    if github_data['status'] == 'fail' or github_data['result'] == 'There is not that user in github.':
        return {'status': 'fail', 'reason': github_data['result']}

    github_data = github_data['result']
    user_data = {"github_id": github_id, "after": "", "tech_stack": True}
    github_user, created = GithubUser.objects.update_or_create(github_id=github_id, defaults={**github_data, 'status':'requested'})
    core_repo_list(user_data)
    return {'status':'success', 'github_user': github_user, 'created': created}


def loading_page(request, github_id):
    github_user = GithubUser.objects.filter(github_id__iexact=github_id).first()
    analysis_data = AnalysisData.objects.filter(github_user=github_user).first()
    error_code = 400

    if not github_user:
        result = update_or_create_github_user(github_id)
        if result.get('status') != 'success':
            return render(request, 'exception_page.html', {'error': error_code, 'message': result.get('reason')})

    if not analysis_data:
        return render(request, 'loading.html', {'github_id': github_id})

    if request.POST.get('update') == 'true':
        result = update_or_create_github_user(github_id)
        if result.get('status') != 'success':
            return render(request, 'exception_page.html', {'error': error_code, 'message': result.get('reason')})
        return JsonResponse({"status":"analyzing"})

    tech_card_data = json.loads(analysis_data.tech_card_data.replace("'", '"'))
    calendar_data = analysis_data.git_calendar_data.replace("'", '"')
    context = {'github_user':github_user, 'tech_card_data': tech_card_data, 'calendar_data': calendar_data}
    return render(request, 'git_analysis.html', context)


def analyze_page(request):
    if request.method != 'POST':
        return JsonResponse({"status":"Not allowed method"})
    github_id = request.POST.get('github_id')
    github_user = GithubUser.objects.filter(github_id__iexact=github_id).first()
    if not github_user:
        return JsonResponse({"status":"no github user in DB"})

    user_status = github_user.status
    if user_status == 'fail':
        return JsonResponse({"status":"fail"})

    elif user_status == 'requested' or user_status == 'progress':
        return JsonResponse({"status":user_status})
    
    # data for calendar
    elif user_status == 'ready':
        today = timezone.now()
        tech_files = TechStackFile.objects.filter(github_id=github_user, author_date__range=[today - relativedelta(years=1), today])
        tech_card_data = make_tech_card_data(tech_files)
        calendar_data = make_calendar_data(tech_files)
        analysis_data, _ = AnalysisData.objects.update_or_create(
            github_user=github_user,
            defaults={
                'tech_card_data': tech_card_data,
                'git_calendar_data': calendar_data,
            }
        )
        github_user.status = 'completed'
        github_user.save()
    else:
    # In case user_status == 'completed'
        analysis_data = AnalysisData.objects.get(github_user=github_user)
        tech_card_data = json.loads(analysis_data.tech_card_data.replace("'", '"'))
        calendar_data = json.loads(analysis_data.git_calendar_data.replace("'", '"'))

    context = {'github_user':github_user, 'tech_card_data': tech_card_data,}
    json_data = {
        'status': user_status,
        'calendar_data': calendar_data
    }
    content = loader.render_to_string(
        'min_git_analysis.html',
        context,
        request
    )
    return JsonResponse({"content": content, **json_data})


def git_rainbow_svg(request, github_id):
    today = timezone.now()
    github_user = GithubUser.objects.filter(github_id__iexact=github_id).first()
    tech_files = TechStackFile.objects.filter(github_id=github_user, author_date__range=[today - relativedelta(years=1), today])
    analysis_data = AnalysisData.objects.filter(github_user=github_user).first()
    if analysis_data:
        tech_card_data = json.loads(analysis_data.tech_card_data.replace("'", '"'))
        calendar_data = json.loads(analysis_data.git_calendar_data.replace("'", '"'))
    elif tech_files:
        tech_card_data = make_tech_card_data(tech_files)
        calendar_data = make_calendar_data(tech_files)
    else:
        return redirect(f'/{github_id}')

    status, svg_inner_html = generate_github_calendar(calendar_data)
    if status == False:
        return JsonResponse({"status":"fail"})

    index = 0
    for tech_data in tech_card_data:
        tech_data['index'] = index
        index += 1
    tech_card_width = 126.25
    return render(request, 'git_rainbow_svg.html', { 'github_id': github_id,
                                                      'tech_card_data': tech_card_data,
                                                      'tech_card_width': tech_card_width,
                                                      'github_calendar_svg': svg_inner_html[0]},
                  content_type='image/svg+xml')
