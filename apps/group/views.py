import json
import random
from collections import defaultdict

import requests
import os
import shutil

from dateutil.relativedelta import relativedelta
from django.db.models import Sum, F, FloatField, Case, Value, When
from django.db.models.functions import TruncDate
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from urllib.parse import urlparse

from django.utils import timezone

from apps.developer.utils import draw_tech_side
from apps.group.utils import core_group_analysis, make_group_calendar_data, make_group_repo_dict_list, \
    save_git_calendar_data, code_crazy_calculation_by_tech
from apps.tech_stack.models import TechStack, GithubUser, GithubCalendar, GithubRepo
from apps.group.models import Group, GroupRepo, Topic

from apps.users.models import User
from utils.github_api.github_api import github_rest_api
from utils.github_calendar_colors.github_calendar_colors import github_calendar_colors
from utils.utils import get_token
from time import time
from config.local_settings import RANDOM_IMG_URL


def make_group_tech_card(group_calendar_data):
    tech_data_dict = defaultdict(lambda: defaultdict(lambda: 0))
    for data in group_calendar_data:
        if data.tech_name in github_calendar_colors.keys():
            date = data.author_date.strftime("%Y-%m-%d")
            tech_data_dict[data.tech_name][date] += data.lines

    total_code_crazy, tech_code_crazy_dict = code_crazy_calculation_by_tech(tech_data_dict)

    sorted_crazy_items = sorted(tech_code_crazy_dict.items(), key=lambda tech_data: tech_data[1], reverse=True)
    sorted_crazy_dict = {tech_name: code_crazy for tech_name, code_crazy in sorted_crazy_items}
    tech_card_data = []
    for tech_name, code_crazy in sorted_crazy_dict.items():
        percent = round(code_crazy / total_code_crazy * 100, 1)
        if percent > 0:
            name_for_file = tech_name.lower()
            tech = {'name': tech_name, 'file': name_for_file,
                    'color': github_calendar_colors[tech_name]['tech_color'] if github_calendar_colors.get(tech_name) else 'rgba(7,141,169,1.0)',
                    'percent': percent}
            img_list = os.listdir('static/img')
            if (f'{name_for_file}.png') not in img_list:
                tech['file'] = f'none{random.randint(1, 3)}'
            tech_card_data.append(tech)
    return tech_card_data


def get_group_calendar_data(calendar_queryset, one_year_ago, six_months_ago=None):
    if six_months_ago:
        period_group_queryset = calendar_queryset.filter(author_date__range=(one_year_ago, six_months_ago))
    else:
        period_group_queryset = calendar_queryset.filter(author_date__gte=one_year_ago)

    period_group_data = period_group_queryset.values('github_id').annotate(
        date_without_time=TruncDate('author_date'),
        day_lines=Sum('lines'),
        tech_code_crazy = Sum(Case(
            When(lines__range=[300, 1000], then=(3 + 0.001 * (F('lines') - 300))),
            When(lines__gt=1000, then=Value(3.7)),
            default=F('lines') * 0.01,
            output_field=FloatField(),
        )),
    ).order_by('-tech_code_crazy')
    return period_group_data


def get_rank_data_list(filtered_calendar_data):
    user_code_crazy_dict = defaultdict(lambda: {'total_lines': 0, "tech_code_crazy": 0})
    for joined_data in filtered_calendar_data:
        github_id = joined_data['github_id']
        lines = joined_data['day_lines']
        tech_code_crazy = joined_data['tech_code_crazy']
        user_code_crazy_dict[github_id]['total_lines'] += lines
        user_code_crazy_dict[github_id]['tech_code_crazy'] += tech_code_crazy

    user_code_crazy_list = []
    for user, user_data in user_code_crazy_dict.items():
        user_code_crazy_list.append({
            'github_id': user,
            'total_lines':user_data['total_lines'],
            "tech_code_crazy":user_data['tech_code_crazy'],
            "int_code_crazy": int(user_data['tech_code_crazy']),
        })
    user_code_crazy_list.sort(key=lambda x: x['tech_code_crazy'], reverse=True)

    acc_count = 0
    current_rank = 1
    for i, ranker in enumerate(user_code_crazy_list):
        if i == 0:
            ranker['rank'] = current_rank
        elif user_code_crazy_list[i]['tech_code_crazy'] == user_code_crazy_list[i-1]['tech_code_crazy']:
            ranker['rank'] = user_code_crazy_list[i-1]['rank']
            acc_count += 1
        else:
            current_rank = i + 1 + acc_count
            ranker['rank'] = current_rank
            acc_count = 0

    return user_code_crazy_list


def append_code_line_percent(rank_list, user_count):
    user_avg_lines = sum(i['total_lines'] for i in rank_list)/user_count
    for ranker in rank_list:
        code_line_percent = round(ranker['total_lines'] / user_avg_lines * 100, 2)
        if code_line_percent < 50:
            code_line_percent = 50
        elif code_line_percent > 95:
            code_line_percent = 95
        ranker['code_line_percent'] = code_line_percent


def group(request, group_id):
    group = Group.objects.select_related('owner').filter(id=group_id).first()
    context = { 'group' : True }

    if not group:
        context.update({'error': 404, 'message': 'There is no group'})
        return render(request, 'exception_page.html', context)

    context.update({'group': group})
    one_year_ago = timezone.now() - relativedelta(years=1)
    six_months_ago = timezone.now() - relativedelta(months=6)
    member_list = group.github_users.all().values_list('github_id', flat=True)
    group_repo_list = group.grouprepo_set.all().values_list('repo_url', flat=True)

    group_calendar_queryset = GithubCalendar.objects.select_related('github_id').filter(github_id__in=member_list, repo_url__in=group_repo_list)
    group_calendar_data = group_calendar_queryset.filter(author_date__gte=one_year_ago)

    six_months_data = get_group_calendar_data(group_calendar_queryset, one_year_ago, six_months_ago)
    post_user_code_crazy_list = get_rank_data_list(six_months_data)
    six_months_rank_dict = {data['github_id']:data['rank'] for data in post_user_code_crazy_list}

    one_year_data = get_group_calendar_data(group_calendar_queryset, one_year_ago)
    user_code_crazy_list = get_rank_data_list(one_year_data)

    for ranker in user_code_crazy_list:
        ranker['change_rank'] = ranker['rank'] - six_months_rank_dict[ranker['github_id']]

    rank_member_count = len(user_code_crazy_list)
    if rank_member_count > 0:
        append_code_line_percent(user_code_crazy_list, rank_member_count)

    ranker_github_data_list = GithubUser.objects.values('github_id', 'avatar_url', 'toptech__tech_name').filter(github_id__in=member_list)
    rank_avatar_url_dict = {ranker['github_id']: ranker['avatar_url'] for ranker in ranker_github_data_list}
    ranker_toptech_dict = {ranker['github_id']: str(ranker['toptech__tech_name']) for ranker in ranker_github_data_list}

    group_tech_card = make_group_tech_card(group_calendar_data)
    is_joined = False
    login_user = request.user
    if login_user.is_authenticated and login_user.github_id in member_list:
        is_joined = True
    context.update({
        'group_tech_card': group_tech_card,
        'is_joined': is_joined,
        'member_list': list(member_list),
        'group_rank_data': user_code_crazy_list,
        'rank_avatar_url_dict': rank_avatar_url_dict,
        'ranker_toptech_dict': ranker_toptech_dict,
    })
    return render(request, 'group.html', context)


def group_graph(request):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", "reason": "Not allowed method"})
    group_id = request.POST.get('group_id')
    group = Group.objects.select_related('owner').filter(id=group_id).first()
    context = { 'group' : True }

    if not group:
        context.update({'error': 404, 'message': 'There is no group'})
        return render(request, 'exception_page.html', context)

    context.update({'group': group})
    one_year_ago = timezone.now() - relativedelta(years=1)
    member_list = list(group.github_users.all().values_list('github_id', flat=True))
    group_repo_list = group.grouprepo_set.all().values_list('repo_url', flat=True)
    group_calendar_data = list(GithubCalendar.objects.filter(github_id__in=member_list, repo_url__in=group_repo_list, author_date__gte=one_year_ago).values('commit_hash', 'github_id', 'tech_name','author_date').annotate(
        repo_url = F('repo_url'),
        lines = Sum('lines'),
        avatar_url = F('github_id__avatar_url')
    ))
    return JsonResponse({"status": "success", "calendar_data": group_calendar_data, "member_list": member_list})


def group_list(request):
    query_tech_name = request.GET.get("tech_name")
    if query_tech_name:
        groups = Group.objects.filter(topic__name__iexact=query_tech_name)
    else:
        groups = Group.objects.all()

    tech_side = draw_tech_side()

    context = { 'group' : True,
                'groups': groups,
                'tech_side': tech_side
    }

    return render(request, 'group_list.html', context)


def check_group_repo(group_name, repo_url):
    if GroupRepo.objects.filter(group__name=group_name, repo_url=repo_url).exists():
        return {'status': 'fail', 'reason': f'{repo_url} already exists', 'error_url': repo_url}

    if urlparse(repo_url[:-4]).netloc == 'github.com':
        name_with_owner = urlparse(repo_url[:-4]).path[1:]
        token = get_token()
        repo_data = github_rest_api(token, 'repos/' + name_with_owner)
        if repo_data.get('message'):
            return {'status':'fail', 'reason': f"{repo_url}: {repo_data.get('message')}", 'error_url': repo_url}
        branch = repo_data.get('default_branch')
        is_private = repo_data.get('private')
    else:
        branch = None
        is_private = False
    repo_data_dict = {
        'repo_url': repo_url,
        'branch': branch,
        'is_private': is_private
    }
    return {'status': 'success', 'repo_info': repo_data_dict}


def refresh_img(request, is_func=None):
    if not is_func and request.method != 'POST':
        return JsonResponse({'status': 'fail', 'reason': 'Not allowed method'})

    temp_storage_path = f'media/temp/{request.user.github_id}'
    if os.path.exists(temp_storage_path) and os.path.isdir(temp_storage_path):
        for file in os.listdir(temp_storage_path):
            file_path = os.path.join(temp_storage_path, file)
            os.unlink(file_path)
    else:
        os.makedirs(temp_storage_path)
    response = requests.get(RANDOM_IMG_URL)
    file_path = f'{temp_storage_path}/{round(time()*1000)}.png'
    with open(file_path, 'wb') as file:
        file.write(response.content)
    if is_func:
        return file_path
    else:
        return JsonResponse({'file_path': file_path})

@login_required(login_url='/login/github')
def remove_group(request, group_id):
    group_list = Group.objects.filter(owner=request.user).values_list('id', flat=True)
    if group_id in group_list:
        Group.objects.filter(id=group_id).delete()
        return JsonResponse({'status': 'completed'})

    return JsonResponse({'status': 'permission denied'})

@login_required(login_url='/login/github')
def create_group(request):
    github_id = request.user.github_id
    if request.method == 'GET':
        tech_side = draw_tech_side()
        context = {
            'group':  True,
            'tech_side': tech_side,
            'default_group_img': refresh_img(request, is_func=True),
        }
        return render(request, 'new_group.html', context)

    if request.method != 'POST':
        return JsonResponse({'status': 'fail', 'reason': 'not allowed method'})

    data = request.POST
    group_name = data.get('group_name')
    if not group_name:
        return JsonResponse({'status': 'fail', 'reason': 'There is no group name'})
    elif Group.objects.filter(owner=request.user, name=group_name).exists():
        return JsonResponse({'status': 'fail', 'reason': 'You already made this group name'})

    is_private = True if data.get('account_type') == 'private' else False
    if is_private:
        join_code = data.get('join_code')
        if not join_code:
            return JsonResponse({'status': 'fail', 'reason': 'Private group has to have code to join'})
        if join_code.startswith(' '):
            return JsonResponse({'status': 'fail', 'reason': 'Invalid code to join'})

    group_repo_list = []
    for repo_url in json.loads(data.get('repo_url_list')):
        repo_res = check_group_repo(group_name, repo_url)
        if repo_res['status'] == 'fail':
            return JsonResponse(repo_res)
        group_repo_list.append(repo_res['repo_info'])

    file_storage_path = f'media/img/{github_id}/{group_name}'
    if not os.path.exists(file_storage_path):
        os.makedirs(file_storage_path)
    if data.get('is_random_img') == 'true':
        temp_file_path = urlparse(data.get('group_img')).path[1:]
        file_name = temp_file_path.split("/")[-1]
        image_path = f'/img/{github_id}/{group_name}/{file_name}'
        shutil.copy(temp_file_path, file_storage_path)
    else:
        image_path = f'/img/{github_id}/{group_name}/{request.FILES.get("group_img")}'
        with open(f'media/{image_path}', 'wb') as image_file:
            for chunk in request.FILES.get('group_img').chunks():
                image_file.write(chunk)
    shutil.rmtree(f'media/temp/{github_id}')

    group_data = {
        'owner': request.user,
        'name': group_name,
        'description': data.get('description'),
        'is_private': is_private,
        'join_code': join_code if is_private else None
    }
    new_group = Group.objects.create(**group_data)
    new_group.img.name = image_path
    new_group.save()
    owner_github_user = GithubUser.objects.get(github_id=github_id)
    new_group.github_users.add(owner_github_user)
    group_repo_instance_list = [
        GroupRepo(
            group=new_group,
            repo_url=repo_info['repo_url'],
            branch=repo_info['branch'],
            is_private=repo_info['is_private']
        )
        for repo_info in group_repo_list if repo_info['repo_url'] != ''
    ]
    GroupRepo.objects.bulk_create(group_repo_instance_list)
    topic_list = json.loads(data.get('topic_list')) if data.get('topic_list') else []
    for topic in topic_list:
        topic_object, _ = Topic.objects.get_or_create(name=topic)
        topic_object.groups.add(new_group)
    return JsonResponse({'status': 'success'})


def group_update(request):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", 'reason': 'Not allowed method'})
    group_id = request.POST.get('group_id')
    if not group_id:
        return JsonResponse({'status': 'fail', 'reason': 'no group id'})
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return JsonResponse({'status': 'fail', 'reason': 'no group'})
    group_member_list = group.github_users.all()
    group_repo_list = group.grouprepo_set.all()
    year_ago = (timezone.now() - relativedelta(years=1)).replace(hour=0, minute=0, second=0).strftime("%Y-%m-%d")
    repo_dict_list = make_group_repo_dict_list(group_member_list, group_repo_list, year_ago)
    session_key = None
    if group.session_key:
        session_key = group.session_key
    response = core_group_analysis(repo_dict_list, session_key)
    if response['status'] == 'progress':
        if not group.session_key:
            group.session_key = response['session_key']
            group.save()
        return JsonResponse({'status': 'progress', 'session_key': group.session_key})
    if response['status'] == 'done':
        member_list = group_member_list.values_list('github_id', flat=True)
        group_repo_list = group_repo_list.values_list('repo_url', flat=True)
        GithubCalendar.objects.filter(github_id__in=member_list, repo_url__in=group_repo_list).delete()
        save_git_calendar_data(response['calendar_data'])
        group.session_key = None
        group.save()
    return JsonResponse({'status': 'completed', 'repo_info': repo_dict_list})

@login_required(login_url='/login/github')
def group_join(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return JsonResponse({"status": "fail", 'reason': 'group does not exist'})
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({"status": "fail", 'reason': 'Login is required'})

    if request.method == 'GET':
        github_id = request.GET.get('github_id')
    else:
        github_id = user.github_id
    group.github_users.add(github_id)

    group_repo_list = group.grouprepo_set.all()
    for repo in group_repo_list:
        GithubRepo.objects.get_or_create(
            github_id_id=github_id,
            repo_url=repo.repo_url,
            defaults={
                'branch': repo.branch,
                'is_private': repo.is_private,
                'status': 'completed',
                'added_type': 'group',
            })

    return JsonResponse({'status': 'completed'})
