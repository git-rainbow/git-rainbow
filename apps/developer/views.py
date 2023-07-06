import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template import loader

from apps.tech_stack.models import GithubUser, AnalysisData
from apps.tech_stack.utils import core_repo_list
from config.local_settings import token_list
from utils.github_api import request_github_profile
from utils.github_calendar.github_calendar import generate_github_calendar
from utils.github_calendar_colors.github_calendar_colors import github_calendar_colors


def exception_view(request, exception=None):
    status = 404
    context = {'error': status, 'message': 'Page not found. Check the address or'}
    if exception is None:
        status = 500
        context = {'error': status, 'message': 'Server error'}
    return render(request, 'exception_page.html', context, status=status)


def main_page(request):
    return render(request, 'index.html')


def update_or_create_github_user(github_id, ghp_token=None):
    user_data = {"github_id": github_id, "tech_stack": True, 'update': True}
    if ghp_token:
        ghp_token = ghp_token.token
        github_data, github_id = request_github_profile(github_id, {'Authorization': f'token {ghp_token}'})
        user_data['ghp_token'] = ghp_token
    else:
        for index in range(len(token_list)):
            github_data, github_id = request_github_profile(github_id, token_list[index])

            if github_data['result'] == 'API token limited.' and len(token_list) - 1 != index:
                continue
            break
    if github_data['status'] == "fail":
        return {'status': 'fail', 'reason': github_data['result']}

    github_data = github_data['result']
    github_user, created = GithubUser.objects.update_or_create(github_id=github_id,
                                                               defaults={**github_data, 'status': 'progress'})
    core_repo_list(user_data)
    return {'status': 'success', 'github_user': github_user, 'created': created}


def git_rainbow(request, github_id):
    github_user = GithubUser.objects.filter(github_id__iexact=github_id).first()
    analysis_data = AnalysisData.objects.filter(github_id=github_user).first()
    error_code = 400
    if not github_user:
        result = update_or_create_github_user(github_id)
        if result.get('status') != 'success':
            return render(request, 'exception_page.html', {'error': error_code, 'message': result.get('reason')})

    if not analysis_data:
        return render(request, 'loading.html', {'github_id': github_id})

    tech_card_data = json.loads(analysis_data.tech_card_data.replace("'", '"'))
    calendar_data = analysis_data.git_calendar_data.replace("'", '"')
    context = {'github_user': github_user, 'tech_card_data': tech_card_data, 'calendar_data': calendar_data}
    return render(request, 'git_analysis.html', context)


def update_git_rainbow(request):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", 'msg': 'Not allowed method'})
    github_user = GithubUser.objects.filter(github_id__iexact=request.POST.get('github_id')).first()
    if not github_user:
        return JsonResponse({"status": "fail", 'msg': 'No github id'})

    github_id = github_user.github_id
    user_data = {"github_id": github_id, "tech_stack": True}
    user_data['update'] = bool(request.POST.get('update') == 'true')
    ghp_token = request.POST.get('ghp_token')
    user_data['ghp_token'] = ghp_token

    core_response = core_repo_list(user_data)
    core_status = core_response['status']
    if core_status == 'progress':
        return JsonResponse({"status": core_status})

    github_user.status = core_status
    github_user.save()

    if core_status == 'fail':
        return JsonResponse({"status": "fail", 'msg': 'Core API fail'})

    calendar_data = core_response.get('calendar_data')
    tech_card_data = core_response.get('tech_card_data')
    AnalysisData.objects.update_or_create(github_id=github_user,
                                          defaults={
                                              'git_calendar_data': calendar_data,
                                              'tech_card_data': tech_card_data
                                          })
    context = {
        'github_user': github_user,
        'tech_card_data': tech_card_data,
    }
    json_data = {
        'status': core_status,
        'calendar_data': json.loads(calendar_data)
    }
    content = loader.render_to_string(
        'min_git_analysis.html',
        context,
        request
    )
    return JsonResponse({"content": content, **json_data})


def git_rainbow_svg(request, github_id):
    github_user = GithubUser.objects.filter(github_id__iexact=github_id).first()
    analysis_data = AnalysisData.objects.filter(github_id=github_user).first()

    if analysis_data:
        tech_card_data = json.loads(analysis_data.tech_card_data.replace("'", '"'))
        calendar_data = json.loads(analysis_data.git_calendar_data.replace("'", '"'))
    else:
        user_data = {"github_id": github_id, "tech_stack": True}
        core_response = core_repo_list(user_data)
        tech_card_data = core_response.get('tech_card_data')
        calendar_data = core_response.get('calendar_data')
        if not tech_card_data:
            return redirect(f'/{github_id}')
        user_result = update_or_create_github_user(github_id)
        if user_result['status'] == 'fail':
            return redirect(f'/{github_id}')
        AnalysisData.objects.create(
            github_id=user_result['github_user'],
            git_calendar_data=calendar_data,
            tech_card_data=tech_card_data
        )

    status, svg_inner_html = generate_github_calendar(json.loads(calendar_data))
    if status == False:
        return redirect(f'/{github_id}')

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


def leaderboards_tech_stack(request, tech_name='Android'):
    sorted_github_calendar_colors = dict(sorted(github_calendar_colors.items(), key=lambda x: x[0].lower()))

    for key in sorted_github_calendar_colors.keys():
        if key.lower() == tech_name.lower():
            tech_name = key
            break

    context = {
        'github_calendar_colors': sorted_github_calendar_colors,
        'tech_name': tech_name,
        'tech_color': sorted_github_calendar_colors.get(tech_name)}
    return render(request, 'leaderboards.html', context)
