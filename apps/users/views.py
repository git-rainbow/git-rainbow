import requests
from django.shortcuts import render, redirect
from django.contrib import auth
from django.contrib.auth.hashers import make_password
from config.local_settings import GH_ID, GH_SECRET, GH_AUTHORIZE_URL, GH_OATH_API_URL

from .models import User
from apps.tech_stack.models import GithubUser

from utils.core_func.core_func import core_repo_list


def github_login(request):
    return redirect(GH_AUTHORIZE_URL)


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
        }
    )

    if created:
        github_user.status = 'requested'
        github_user.save()
        core_repo_list({"github_id": github_id, "after": "", "tech_stack": True})
    return redirect(f'/{github_id}')


def logout(request):
    auth.logout(request)
    return redirect('/')
