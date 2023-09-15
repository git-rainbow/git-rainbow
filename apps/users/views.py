import requests
from django.shortcuts import render, redirect
from django.contrib import auth
from django.contrib.auth.hashers import make_password
from config.local_settings import GH_ID, GH_SECRET, GH_AUTHORIZE_URL, GH_OATH_API_URL, GH_REDIRECT_URL

from .models import User
from apps.tech_stack.models import GithubUser
from apps.tech_stack.utils import core_repo_list
from ..tech_stack.create_table import create_github_calendar_table


def github_login(request):
    next = ''
    for k, v in request.GET.items():
        if next == '':
            next += f'{k}={v}?'
        else:
            next += f'{k}={v}|'

    add_next_location = GH_AUTHORIZE_URL.replace(GH_REDIRECT_URL, f'{GH_REDIRECT_URL}?{next[:-1]}')
    return redirect(add_next_location)


def github_callback(request):
    result = requests.post(
        f"https://github.com/login/oauth/access_token?client_id={GH_ID}&client_secret={GH_SECRET}&code={request.GET.get('code')}",
        headers={"Accept": "application/json"}
        )
    error_code = 400
    if result.status_code != 200:
        return render(request, 'exception_page.html', {'error': error_code, 'message': 'Failed requestng github login'})

    result_json = result.json()
    access_token = result_json.get("access_token")
    if not access_token:
        return render(request, 'exception_page.html', {'error': error_code, 'message': 'There is no access token'})

    profile_request = requests.get(
        GH_OATH_API_URL,
        headers={
            "Authorization": f"token {access_token}",
            "Accept": "application/json"}
        )
    if profile_request.status_code != 200:
        return render(request, 'exception_page.html', {'error': error_code, 'message': 'Failed getting github profile'})

    profile_json = profile_request.json()
    api_message = profile_json.get("message")
    if api_message:
        return render(request, 'exception_page.html', {'error': error_code, 'message': api_message})

    github_id = profile_json.get("login")
    if not github_id:
        return render(request, 'exception_page.html', {'error': error_code, 'message': 'There is not that github id'})

    user, _ = User.objects.get_or_create(github_id=github_id, defaults={'password': make_password(None)})
    auth.login(request, user)

    github_user, created = GithubUser.objects.update_or_create(
        github_id=github_id,
        defaults={
            'user_id': user.id,
            'name': profile_json.get("name"),
            'email': profile_json.get("email"),
            'avatar_url': profile_json.get("avatar_url"),
            'bio': profile_json.get("bio"),
            'is_valid': True,
        }
    )

    if created:
        create_github_calendar_table(github_id)
        github_user.status = 'requested'
        github_user.save()
        core_repo_list({"github_id": github_id, "after": "", "tech_stack": True})
    next = request.GET.get('next').replace('|', '&')
    response = redirect(f'{next}')
    response.set_cookie('gho_token', access_token)
    return response


def logout(request):
    auth.logout(request)
    next = ''
    for k, v in request.GET.items():
        if next == '':
            next += f'{v}?'
        else:
            next += f'{k}={v}&'

    return redirect(next[:-1])
