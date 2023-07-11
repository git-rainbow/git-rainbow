import json

from dateutil.relativedelta import relativedelta
from django.core.paginator import Paginator
from django.db.models import Sum, F, Count, Max, Q
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template import loader
from django.utils import timezone

from apps.tech_stack.models import GithubUser, AnalysisData, GithubCalendar, Ranking
from apps.tech_stack.utils import core_repo_list
from config.local_settings import token_list
from utils.github_api import request_github_profile
from utils.github_calendar.github_calendar import generate_github_calendar
from utils.github_calendar_colors.github_calendar_colors import github_calendar_colors
from utils.github_id.github_id import check_github_id


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
    github_data, github_id = request_github_profile(github_id, ghp_token)
    if github_data['status'] == "fail":
        return {'status': 'fail', 'reason': github_data['result']}

    github_data = github_data['result']
    github_user, _ = GithubUser.objects.update_or_create(github_id=github_id,
                                                               defaults={**github_data})
    return {'status': 'success', 'github_user': github_user}


def git_rainbow(request, github_id):
    error_code = 400
    is_github_id_valid = check_github_id(github_id)
    if not is_github_id_valid:
        return render(request, 'exception_page.html', {'error': error_code, 'message': 'Invalid github id'})
    github_user = GithubUser.objects.filter(github_id__iexact=github_id).first()
    analysis_data = AnalysisData.objects.filter(github_id=github_user).first()

    if not github_user:
        user_result = update_or_create_github_user(github_id)
        if user_result.get('status') != 'success':
            return render(request, 'exception_page.html', {'error': error_code, 'message': user_result.get('reason')})
        github_user = user_result['github_user']

    if not analysis_data:
        user_data = {"github_id": github_id, "tech_stack": True}
        core_response = core_repo_list(user_data)
        github_user.status = core_response['status']
        github_user.save()
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
    github_user.status = core_status
    github_user.save()

    if core_status == 'progress':
        return JsonResponse({"status": core_status})

    if core_status == 'fail':
        return JsonResponse({"status": "fail", 'msg': 'Core API fail'})

    update_or_create_github_user(github_id, ghp_token)
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
    if not github_user:
        user_result = update_or_create_github_user(github_id)
        if user_result['status'] == 'fail':
            return render(request, 'exception_page.html', {'error': 404, 'message': user_result['reason']})
        github_user = user_result['github_user']

    analysis_data = AnalysisData.objects.filter(github_id=github_user).first()

    if analysis_data:
        tech_card_data = json.loads(analysis_data.tech_card_data.replace("'", '"'))
        calendar_data = json.loads(analysis_data.git_calendar_data.replace("'", '"'))
    else:
        user_data = {"github_id": github_id, "tech_stack": True}
        core_response = core_repo_list(user_data)
        github_user.status = core_response['status']
        github_user.save()
        tech_card_data = core_response.get('tech_card_data')
        calendar_data = core_response.get('calendar_data')
        if not tech_card_data:
            return redirect(f'/{github_id}')
        AnalysisData.objects.create(
            github_id=github_user,
            git_calendar_data=calendar_data,
            tech_card_data=tech_card_data
        )

    status, svg_inner_html = generate_github_calendar(calendar_data)
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


def make_ranker_data(tech_name):
    today = timezone.now()
    year_ago = (today - relativedelta(years=1)).replace(hour=0, minute=0, second=0)

    now_tech_ranker = GithubCalendar.objects.filter(tech_name__iexact=tech_name, author_date__range=[year_ago, today]).values('github_id').annotate(
        tech_code_crazy=Count('github_id'),
        total_lines=Sum('lines'),
        avatar_url=F('github_id__avatar_url'),
        analysisdata=F('github_id__analysisdata__tech_card_data'),
        midnight_tech=F('github_id__ranking__tech_name'),
        midnight_rank=F('github_id__ranking__midnight_rank'),
        # Ranking in order of Crazy (days/365 %) X Coding lines
        rank_point=F('tech_code_crazy') * F('total_lines')
    ).exclude(total_lines=0).filter(Q(midnight_tech=tech_name) | Q(midnight_tech=None)).order_by('-rank_point')

    if now_tech_ranker:
        most_user_code_lines = now_tech_ranker.aggregate(total_lines=Max('total_lines'))['total_lines']
    rank = 0
    for ranker in now_tech_ranker:
        rank += 1
        ranker['rank'] = rank
        if ranker['midnight_rank'] is None:
            change_rank = 0
        else:
            change_rank = ranker['midnight_rank'] - rank
        ranker['change_rank'] = change_rank
        code_line_percent = round(ranker['total_lines'] / most_user_code_lines * 95, 2)
        if code_line_percent < 25:
            code_line_percent = 25
        ranker['code_line_percent'] = code_line_percent
        ranker['top_tech'] = json.loads(ranker['analysisdata'].replace("'", '"'))[0]['name']
        ranker['total_lines'] = format(ranker['total_lines'], ',')
    return now_tech_ranker


def save_tech_ranking_data(request):
    sorted_github_calendar_colors = dict(sorted(github_calendar_colors.items(), key=lambda x: x[0].lower()))
    Ranking.objects.all().delete()
    for tech_name in sorted_github_calendar_colors.keys():
        now_ranker_data = make_ranker_data(tech_name)
        rank = 0
        for ranker in now_ranker_data:
            rank += 1
            Ranking.objects.update_or_create(
                github_id_id=ranker['github_id'],
                tech_name=tech_name,
                defaults={'midnight_rank': rank})
    return JsonResponse({'status': 'success'})


def leaderboards_tech_stack(request, tech_name='Android'):
    sorted_github_calendar_colors = dict(sorted(github_calendar_colors.items(), key=lambda x: x[0].lower()))
    if tech_name.lower() == 'c_sharp':
        tech_name = 'C#'
    else:
        for key in sorted_github_calendar_colors.keys():
            if key.lower() == tech_name.lower():
                tech_name = key
                break

    now_ranker_data = make_ranker_data(tech_name)
    page_number = request.GET.get('page')
    items_per_page = 5
    paginator = Paginator(now_ranker_data, items_per_page)
    page_rank_data = paginator.get_page(page_number)
    context = {
        'github_calendar_colors': sorted_github_calendar_colors,
        'tech_name': tech_name,
        'tech_color': sorted_github_calendar_colors.get(tech_name),
        'top_ranker': now_ranker_data[:3],
        'now_ranker_data': page_rank_data,
    }
    if request.user.is_authenticated:
        context['user'] = request.user.githubuser_set.first()
        github_id = context['user'].github_id
        if now_ranker_data.filter(github_id=github_id).first():
            for ranker in now_ranker_data:
                if ranker['github_id'] == github_id:
                    context['user_rank'] = ranker['rank']
                    break

    return render(request, 'leaderboards.html', context)
