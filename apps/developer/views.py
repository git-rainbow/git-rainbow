from django.http import JsonResponse
from django.shortcuts import render

from apps.tech_stack.models import GithubUser
from config.local_settings import token_list
from utils.core_func.core_func import core_repo_list
from utils.github_api import request_github_profile


def main_page(request):
    return render(request, 'index.html')


def loading_page(request, github_id):
    github_user = GithubUser.objects.filter(github_id=github_id).first()
    if github_user:
        return render(request, 'loading.html')

    for index in range(len(token_list)):
        github_data = request_github_profile(github_id, token_list[index])
        if github_data['status'] == "success":
            break

        if len(token_list)-1 == index and github_data['result'] == 'token error':
            return JsonResponse({'status': 'fail', 'reason': 'token error'})

    if github_data['status'] == 'fail' or github_data['result'] == 'no user':
        return JsonResponse({'status': 'fail', 'reason': github_data['result']})

    GithubUser.objects.create(
        github_id=github_id,
        email=github_data['result']['email'],
        avatar_url= github_data['result']['avatar_url'],
        bio=github_data['result']['bio'],
    )

    user_data = {"github_id": github_id, "after": "", "tech_stack": True}
    core_repo_list(user_data)
    return render(request, 'loading.html')
