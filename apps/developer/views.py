import json
from datetime import datetime

import pytz
import requests

from dateutil.relativedelta import relativedelta
from django.core.paginator import Paginator
from django.db.models import Sum, F, Count, Max, Avg, OuterRef, Subquery, Window
from django.db.models.functions import Rank
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
    github_user = GithubUser.objects.prefetch_related('githubcalendar_set').filter(github_id__iexact=github_id).first()
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
    top3_tech_data = []
    for tech_data in tech_card_data[:3]:
        tech_rank_data = make_ranker_data(tech_data['name'])
        for rank_data in tech_rank_data:
            if rank_data['github_id'] == github_user.github_id:
                tech_data['rank'] = rank_data
                tech_data['ranker_num'] = tech_rank_data.count()
                tech_data['rank_percent'] = round(rank_data['rank']/tech_data['ranker_num']*100, 1)
                top3_tech_data.append(tech_data)
                break
    context = {'github_user': github_user, 'tech_card_data': tech_card_data, 'calendar_data': calendar_data,
               'top3_tech_data': top3_tech_data, 'days': len(json.loads(calendar_data).keys())}
    last_day = github_user.githubcalendar_set.aggregate(last_day=Max('author_date'))['last_day']
    if last_day:
        last_day_commits_data = github_user.githubcalendar_set.filter(author_date=last_day)
        last_tech_data = str({last_day.strftime("%Y-%m-%d"): {data['tech_name']: data['lines'] for data in last_day_commits_data.values()}}).replace("'", '"')
        context["last_tech_data"] = last_tech_data
    return render(request, 'git_rainbow.html', context)


def check_user_token(github_id, token):
    token_check_api_url = 'https://api.github.com/user'
    token_check_res = requests.get(token_check_api_url, headers={'Authorization': f'token {token}'}).json()
    token_check_message = token_check_res.get('message')
    if token_check_message:
        return {'status': 'fail', 'reason': token_check_message}
    elif token_check_res.get('login') != github_id:
        return {'status': 'fail', 'reason': 'Github ID and token mismatched'}
    else:
        return {'status':'success'}


def update_git_rainbow(request):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", 'reason': 'Not allowed method'})
    github_user = GithubUser.objects.filter(github_id__iexact=request.POST.get('github_id')).first()
    if not github_user:
        return JsonResponse({"status": "fail", 'reason': 'No github id'})

    github_id = github_user.github_id
    user_data = {"github_id": github_id, "tech_stack": True}
    user_data['update'] = bool(request.POST.get('update') == 'true')
    ghp_token = request.POST.get('ghp_token')
    user_data['ghp_token'] = ghp_token

    if ghp_token:
        check_user_token_result = check_user_token(github_id, ghp_token)
        if check_user_token_result.get('status') == 'fail':
            return JsonResponse(check_user_token_result)

    core_response = core_repo_list(user_data)
    core_status = core_response['status']
    github_user.status = core_status
    github_user.save()

    if core_status == 'progress':
        return JsonResponse({"status": core_status})

    if core_status == 'fail':
        return JsonResponse({"status": "fail", 'reason': 'Core API fail'})

    update_or_create_github_user(github_id, ghp_token)
    calendar_data = core_response.get('calendar_data')
    tech_card_data = core_response.get('tech_card_data')
    AnalysisData.objects.update_or_create(github_id=github_user,
                                          defaults={
                                              'git_calendar_data': calendar_data,
                                              'tech_card_data': tech_card_data
                                          })
    sava_github_calendar_data(calendar_data, github_user)
    calendar_data = json.loads(calendar_data)
    top3_tech_data = []
    for tech_data in tech_card_data[:3]:
        tech_rank_data = make_ranker_data(tech_data['name'])
        for rank_data in tech_rank_data:
            if rank_data['github_id'] == github_user.github_id:
                tech_data['rank'] = rank_data
                tech_data['ranker_num'] = tech_rank_data.count()
                tech_data['rank_percent'] = round(rank_data['rank'] / tech_data['ranker_num'] * 100, 1)
                top3_tech_data.append(tech_data)
                break
    context = {
        'top3_tech_data': top3_tech_data,
        'github_user': github_user,
        'tech_card_data': tech_card_data,
        'days':len(calendar_data.keys()),
    }
    json_data = {
        'status': core_status,
        'calendar_data': calendar_data
    }
    content = loader.render_to_string(
        'min_git_rainbow.html',
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
        # Ranking in order of Crazy (days/365 %) X Coding lines
        rank_point=F('tech_code_crazy') * F('total_lines'),
        midnight_rank=Subquery(Ranking.objects.filter(tech_name=OuterRef('tech_name'), github_id=OuterRef('github_id')).values('midnight_rank')),
        rank=Window(expression=Rank(), order_by=F('rank_point').desc()),
    ).exclude(total_lines=0).order_by('rank')

    if now_tech_ranker:
        user_avg_lines = now_tech_ranker.aggregate(avg_lines=Avg('total_lines'))['avg_lines'] * 2
        total_ranking_count = now_tech_ranker.count()
    for ranker in now_tech_ranker:
        last_rank = ranker.get('midnight_rank')
        current_rank = ranker.get('rank')
        ranker['change_rank'] = last_rank - current_rank if last_rank else total_ranking_count - current_rank
        code_line_percent = round(ranker['total_lines'] / user_avg_lines * 100, 2)
        if code_line_percent < 25:
            code_line_percent = 25
        elif code_line_percent > 95:
            code_line_percent = 95
        ranker['code_line_percent'] = code_line_percent
        if ranker['analysisdata'] == '[]':
            ranker['top_tech'] = 'none'
        else:
            ranker['top_tech'] = json.loads(ranker['analysisdata'].replace("'", '"'))[0]['name']
        ranker['total_lines'] = format(ranker['total_lines'], ',')
    return now_tech_ranker


def save_tech_ranking_data(request):
    sorted_github_calendar_colors = dict(sorted(github_calendar_colors.items(), key=lambda x: x[0].lower()))
    Ranking.objects.all().delete()
    for tech_name in sorted_github_calendar_colors.keys():
        now_ranker_data = make_ranker_data(tech_name)
        for ranker in now_ranker_data:
            Ranking.objects.update_or_create(
                github_id_id=ranker['github_id'],
                tech_name=tech_name,
                defaults={'midnight_rank': ranker['rank']})
    return JsonResponse({'status': 'success'})


def sava_github_calendar_data(git_calendar_data, github_user):
    github_user.githubcalendar_set.all().delete()
    calendar_data = json.loads(git_calendar_data.replace("'", '"'))
    git_calendar_data_bulk = []
    for author_date, data in calendar_data.items():
        date_format = "%Y-%m-%d"
        datetime_object = datetime.strptime(author_date, date_format)
        datetime_object = pytz.utc.localize(datetime_object)
        for tech_name, lines in data.items():
            github_calendar = GithubCalendar(
                github_id=github_user,
                author_date=datetime_object,
                tech_name=tech_name,
                lines=lines
            )
            git_calendar_data_bulk.append(github_calendar)
    GithubCalendar.objects.bulk_create(git_calendar_data_bulk)


def ranking_all(request):
    today = timezone.now()
    year_ago = (today - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    tech_with_developer_count = GithubCalendar.objects.values('tech_name').annotate(developer_count=Count('github_id'))
    sort_techs_in_calendar_tech = sorted(tech_with_developer_count, key=lambda x: x['developer_count'], reverse=True)
    sorted_github_calendar_colors = {item['tech_name']: github_calendar_colors[item['tech_name']] for item in sort_techs_in_calendar_tech if item['tech_name'] in github_calendar_colors.keys()}
    tech_table_joined = GithubCalendar.objects.filter(author_date__range=[year_ago, today]).values('github_id').annotate(
        tech_code_crazy=Count('github_id'),
        total_lines=Sum('lines'),
        avatar_url=F('github_id__avatar_url'),
        analysisdata=F('github_id__analysisdata__tech_card_data'),
        rank_point=F('tech_code_crazy') * F('total_lines'),
    ).exclude(total_lines=0)

    rank_data = dict()
    count = 0

    for tech_name, color in sorted_github_calendar_colors.items():
        tech_rank_data = tech_table_joined.filter(tech_name__iexact=tech_name).annotate(
            rank=Window(expression=Rank(), order_by=F('rank_point').desc()),
        ).order_by('rank')
        tech_rank_data = tech_rank_data[0:3]

        for ranker in tech_rank_data:
            user_avg_lines = tech_rank_data.aggregate(avg_lines=Avg('total_lines'))['avg_lines'] * 2
            code_line_percent = round(ranker['total_lines'] / user_avg_lines * 100, 2)
            if code_line_percent < 50:
                code_line_percent = 50
            elif code_line_percent > 95:
                code_line_percent = 95
            ranker['code_line_percent'] = code_line_percent
            if ranker['analysisdata'] == '[]':
                ranker['top_tech'] = 'none'
            else:
                ranker['top_tech'] = json.loads(ranker['analysisdata'].replace("'", '"'))[0]['name']
        
        top3_data = tech_rank_data[0:3]
        top3_data = tech_rank_data
        rank_data[tech_name] = {'color': color, 'top3_data':top3_data}

        count +=1
        if count == 10:
            break

    context = {
        'github_calendar_colors': sorted_github_calendar_colors,
        'rank_data': rank_data
    }
    return render(request, 'ranking_all.html', context=context)


def ranking_tech_stack(request, tech_name='Android'):
    tech_with_developer_count = GithubCalendar.objects.values('tech_name').annotate(developer_count=Count('github_id'))
    sort_techs_in_calendar_tech = sorted(tech_with_developer_count, key=lambda x: x['developer_count'], reverse=True)
    sorted_github_calendar_colors = {item['tech_name']: github_calendar_colors[item['tech_name']] for item in sort_techs_in_calendar_tech if item['tech_name'] in github_calendar_colors.keys()}
    if tech_name.lower() == 'c_sharp':
        tech_name = 'C#'
    else:
        for key in sorted_github_calendar_colors.keys():
            if key.lower() == tech_name.lower():
                tech_name = key
                break

    now_ranker_data = make_ranker_data(tech_name)
    page_number = request.GET.get('page')
    items_per_page = 50
    paginator = Paginator(now_ranker_data, items_per_page)
    page_rank_data = paginator.get_page(page_number)
    total_rank_count = now_ranker_data.count()
    context = {
        'github_calendar_colors': sorted_github_calendar_colors,
        'tech_name': tech_name,
        'tech_color': sorted_github_calendar_colors.get(tech_name),
        'top_ranker': now_ranker_data[:3],
        'now_ranker_data': page_rank_data,
        'total_rank_count': format(total_rank_count, ','),
    }
    if request.user.is_authenticated:
        context['login_user'] = request.user.githubuser_set.first()
        github_id = context['login_user'].github_id
        if now_ranker_data.filter(github_id=github_id).first():
            for ranker in now_ranker_data:
                if ranker['github_id'] == github_id:
                    context['login_user_rank'] = ranker['rank']
                    context['login_user_data'] = ranker
                    break

    return render(request, 'ranking.html', context)


def find_user_page(request):
    if request.method != 'POST':
        return render(request, 'exception_page.html', {'error': 403, 'message': 'Not allowed method'})   

    tech_name, search_user = request.POST.values()
    now_ranker_data = make_ranker_data(tech_name)
    
    items_per_page = 50
    search_user_page_number = 0
    exist = None
    for data in now_ranker_data:
        if data.get('github_id') == search_user:
            search_user_rank = data.get('rank')
            search_user_page_number = search_user_rank//items_per_page + 1
            exist = True
            break
    result = {
        'exist': exist,
        'tech_name': tech_name,
        'search_user': search_user,
        'search_user_page_number': search_user_page_number
    }
    return JsonResponse(result)
