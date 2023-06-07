import requests
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import auth
from django.contrib.auth.hashers import make_password
from config.local_settings import GH_ID, GH_SECRET, GH_AUTHORIZE_URL, GH_OATH_API_URL

from .models import User
from apps.tech_stack.models import GithubUser


def github_login(request):
    return redirect(GH_AUTHORIZE_URL)


def github_callback(request):
    result = requests.post(
        f"https://github.com/login/oauth/access_token?client_id={GH_ID}&client_secret={GH_SECRET}&code={request.GET.get('code')}",
        headers={"Accept": "application/json"}
        )
    if result.status_code != 200:
        return JsonResponse({"response":" failed github login request"})

    result_json = result.json()
    access_token = result_json.get("access_token")
    if not access_token:
        return JsonResponse({"response":"no access_token"})

    profile_request = requests.get(
        GH_OATH_API_URL,
        headers={
            "Authorization": f"token {access_token}",
            "Accept": "application/json"}
        )
    if profile_request.status_code != 200:
        return JsonResponse({"response":"failed getting github profile"})

    profile_json = profile_request.json()
    if profile_json.get("message"):
        return JsonResponse({"response":profile_json})

    github_id = profile_json.get("login")
    if not github_id:
        return JsonResponse({"response":"no github_id"})

    user, _ = User.objects.get_or_create(github_id=github_id, defaults={'password': make_password(None)})
    auth.login(request, user)

    GithubUser.objects.update_or_create(
        github_id=github_id,
        defaults={
            'user_id': user.id,
            'name': profile_json.get("name"),
            'email': profile_json.get("email"),
            'avatar_url': profile_json.get("avatar_url"),
            'bio':profile_json.get("bio")
        }
    )
    return redirect('/')


def logout(request):
    auth.logout(request)
    return redirect('/')
