import json
import requests
import os
import shutil
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from urllib.parse import urlparse
from apps.tech_stack.models import TechStack, GithubUser
from apps.group.models import Group, GroupRepo, Topic
from apps.developer.views import draw_ranking_side
from utils.github_api.github_api import github_rest_api
from utils.utils import get_token
from time import time
from config.local_settings import RANDOM_IMG_URL


def group(request, group_id):
    context = { 'group' : True }

    return render(request, 'group.html', context)

def group_list(request):
    groups = Group.objects.all()
    ranking_side = draw_ranking_side()

    context = { 'group' : True,
                'groups': groups,
                'ranking_side': ranking_side
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
def create_group(request):
    github_id = request.user.github_id
    if request.method == 'GET':
        ranking_side = draw_ranking_side()
        context = {
            'group':  True,
            'ranking_side': ranking_side,
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
        for repo_info in group_repo_list
    ]
    GroupRepo.objects.bulk_create(group_repo_instance_list)
    topic_list = json.loads(data.get('topic_list')) if data.get('topic_list') else []
    for topic in topic_list:
        topic_object, _ = Topic.objects.get_or_create(name=topic)
        topic_object.groups.add(new_group)
    return JsonResponse({'status': 'success'})
