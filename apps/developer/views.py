import os
import random
from django.shortcuts import render
from django.http import JsonResponse
from django.template import loader
from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import Trunc
from dateutil.relativedelta import relativedelta
from apps.tech_stack.models import GithubUser, TechStackFile
from config.local_settings import token_list
from utils.core_func.core_func import core_repo_list
from utils.github_api import request_github_profile
from utils.git_analysis.calendar import git_calendar_colors


def main_page(request):
    return render(request, 'index.html')


def loading_page(request, github_id):
    github_user = GithubUser.objects.filter(github_id=github_id).first()
    context = {'github_id': github_id}
    if github_user:
        return render(request, 'loading.html', context)

    for index in range(len(token_list)):
        github_data = request_github_profile(github_id, token_list[index])
        if github_data['status'] == "success":
            break

        if len(token_list)-1 == index and github_data['result'] == 'token error':
            return JsonResponse({'status': 'fail', 'reason': 'token error'})

    if github_data['status'] == 'fail' or github_data['result'] == 'no user':
        return JsonResponse({'status': 'fail', 'reason': github_data['result']})

    github_user = GithubUser.objects.create(
        github_id=github_id,
        email=github_data['result']['email'],
        avatar_url= github_data['result']['avatar_url'],
        bio=github_data['result']['bio'],
    )

    user_data = {"github_id": github_id, "after": "", "tech_stack": True}
    github_user.status = 'requested'
    github_user.save()
    core_repo_list(user_data)
    return render(request, 'loading.html', context)


def make_calendar_tech_data(tech_stack_files):
    tech_name_list = tech_stack_files.exclude(tech_type='Data').distinct().values_list('tech_name', flat=True)
    tech_data = {tech: 0 for tech in tech_name_list}
    total_line = 0
    for file in tech_stack_files:
        if tech_data.get(file.tech_name) is not None:
            tech_data[file.tech_name] += file.lines
            total_line += file.lines
    tech_data = sorted(tech_data.items(), key=lambda x: x[1], reverse=True)[:8]
    calendar_tech_data = []
    for tech_name, lines in tech_data:
        percent = round(lines / total_line * 100, 1)
        if percent > 0:
            name_for_file = tech_name.lower()
            tech = {'name': tech_name, 'file': name_for_file,
                    'color': git_calendar_colors.get(tech_name, 'rgba(7,141,169,1.0)'),
                    'percent': percent}
            img_list = os.listdir('static/img')
            if (f'{name_for_file}.png') not in img_list:
                tech['file'] = f'none{random.randint(1, 3)}'
            calendar_tech_data.append(tech)
    return calendar_tech_data


def make_profile_calendar_data(tech_files):
    commit_date = tech_files.annotate(date=Trunc('author_date', 'day')).values('date').distinct()
    calendar_data = {}
    for date in commit_date:
        data = tech_files.exclude(tech_type='Data') \
            .filter(author_date__range=[date['date'], date['date'].replace(hour=23, minute=59, second=59)]) \
            .values("tech_name") \
            .annotate(lines=Sum('lines')) \
            .order_by('-lines')
        commit_data = dict(data.values_list('tech_name','lines')) if dict(data.values_list('tech_name','lines')) else 0
        calendar_data[date['date'].strftime("%Y-%m-%d")] = commit_data
    return calendar_data


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
    calendar_tech_data = make_calendar_tech_data(tech_files)
    calendar_data = make_profile_calendar_data(tech_files)

    context = {'github_user':github_user, 'calendar_tech_data': calendar_tech_data,}
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
