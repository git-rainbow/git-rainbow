import json
from collections import defaultdict
from datetime import datetime
from threading import Thread

import pytz
import requests

from dateutil.relativedelta import relativedelta
from django.core.paginator import Paginator
from django.db.models import Sum, F, Count, FloatField, Case, Value, When
from django.db.models.functions import TruncDate
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template import loader
from django.utils import timezone

from apps.developer.utils import draw_tech_side, make_last_tech_data
from apps.group.utils import core_user_analysis, update_code_crazy
from apps.group.views import save_git_calendar_data, make_group_tech_card
from apps.tech_stack.create_table import create_github_calendar_table
from apps.tech_stack.models import GithubUser, AnalysisData, GithubCalendar, Ranking, GithubRepo, TechStack, TopTech, \
    get_calendar_model, CodeCrazy
from apps.tech_stack.utils import core_repo_list
from utils.github_api.github_api import request_github_profile
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
                                                         defaults={
                                                             **github_data,
                                                             'is_valid': True
                                                         })
    create_github_calendar_table(github_id)
    return {'status': 'success', 'github_user': github_user}


def make_user_code_crazy(github_id):
    code_crazy = 0
    LOW_LIMIT = 300
    HIGH_LIMIT = 1000
    LOW_MULTIPLIER = 0.01
    HIGH_MULTIPLIER = 0.001
    BASIC_POINTS = 3
    MAX_POINTS = 3.7
    user_commit_data = get_calendar_model(github_id).objects.annotate(date_without_time=TruncDate('author_date')).values('date_without_time').annotate(total_lines=Sum('lines'))
    for day_data in user_commit_data:
        total_lines = day_data['total_lines']
        if total_lines <= LOW_LIMIT:
            code_crazy += total_lines * LOW_MULTIPLIER
        elif LOW_LIMIT < total_lines < HIGH_LIMIT:
            code_crazy += BASIC_POINTS + HIGH_MULTIPLIER * (total_lines - LOW_LIMIT)
        else:
            code_crazy += MAX_POINTS
    code_crazy = round(code_crazy, 3)
    int_code_crazy = int(code_crazy)
    return code_crazy, int_code_crazy


def get_user_calendar(request, github_id):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", "reason": "Not allowed method"})
    github_user = GithubUser.objects.filter(github_id=github_id).first()

    if not github_user:
        return JsonResponse({"status": "No github user"})

    one_year_ago = timezone.now() - relativedelta(years=1)
    calendar_data = list(get_calendar_model(github_id).objects.filter(
        author_date__gte=one_year_ago
    ).values(
        'commit_hash', 'github_id', 'tech_name','author_date'
    ).annotate(
        repo_url=F('repo_url'),
        lines=Sum('lines'),
        avatar_url=F('github_id__avatar_url')
    ))
    return JsonResponse({"status": "success", "calendar_data": calendar_data})


def get_profile_data(github_calendar_list, github_user):
    if github_calendar_list:
        tech_card_data = make_group_tech_card(github_calendar_list)
        top3_tech_data = make_top3_tech_date(tech_card_data, github_user)
        code_crazy, int_code_crazy = make_user_code_crazy(github_user.github_id)
        context = {
            'github_user': github_user,
            'tech_card_data': tech_card_data,
            'top3_tech_data': top3_tech_data,
            'int_code_crazy': int_code_crazy,
            'code_crazy': code_crazy,
        }
    else:
        context = {
            'github_user': github_user,
            'tech_card_data': [],
            'top3_tech_data': [],
            'int_code_crazy': 0,
            'code_crazy': 0,
        }
    return context


def git_rainbow(request, github_id):
    error_code = 400
    is_github_id_valid = check_github_id(github_id)
    if not is_github_id_valid:
        return render(request, 'exception_page.html', {'error': error_code, 'message': 'Invalid github id'})
    github_user = GithubUser.objects.prefetch_related('githubrepo_set').filter(github_id__iexact=github_id, is_valid=True).first()
    if not github_user:
        new_github_user, _ = GithubUser.objects.get_or_create(github_id=github_id)
        user_result = update_or_create_github_user(github_id)
        if user_result.get('status') != 'success':
            return render(request, 'exception_page.html', {'error': error_code, 'message': user_result.get('reason')})
        github_user = user_result['github_user']
        github_id = github_user.github_id
        if new_github_user.github_id != github_id:
            new_github_user.delete()

    year_ago = (timezone.now() - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    github_calendar_list = list(get_calendar_model(github_id).objects.filter(author_date__gte=year_ago).values('tech_name', 'author_date', 'lines'))
    if request.GET.get('update') == 'True' or not github_calendar_list:
        core_response = core_user_analysis(github_user)
        if core_response.get("repo_list_status") == 'fail':
            return render(request, 'exception_page.html', core_response)

    if not github_calendar_list:
        return render(request, 'loading.html', {'github_id': github_id})
    context = get_profile_data(github_calendar_list, github_user)
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


def save_repo_url(request, github_id):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", "reason": "Not allowed method"})

    repo_url = request.POST.get("repo_url")
    try:
        res_code = requests.get(repo_url).status_code
        if res_code == 200:
            GithubRepo.objects.update_or_create(github_id_id=github_id, repo_url=repo_url, defaults={'added_type':'by_user'})
    except Exception as e:
        res_code = 404
    return JsonResponse({"status": res_code})


def update_git_rainbow(request, github_id):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", 'reason': 'Not allowed method'})
    github_user = GithubUser.objects.prefetch_related('githubrepo_set').filter(github_id__iexact=github_id, is_valid=True).first()
    if not github_user:
        return JsonResponse({"status": "fail", 'reason': 'No github id'})

    github_id = github_user.github_id
    user_data = {"github_id": github_id, "tech_stack": True}
    ghp_token = request.POST.get('ghp_token')
    user_data['ghp_token'] = ghp_token
    if ghp_token:
        check_user_token_result = check_user_token(github_id, ghp_token)
        if check_user_token_result.get('status') == 'fail':
            return JsonResponse(check_user_token_result)
    core_response = core_user_analysis(github_user)
    if core_response.get("repo_list_status") == 'fail':
        return render(request, 'exception_page.html', core_response)

    core_status = core_response['status']
    if core_status == 'fail':
        return JsonResponse(core_response)
    elif core_status == 'progress':
        return JsonResponse(core_response)

    year_ago = (timezone.now() - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    github_calendar_list = list(get_calendar_model(github_id).objects.filter(author_date__gte=year_ago).values('tech_name', 'author_date', 'lines'))
    context = get_profile_data(github_calendar_list, github_user)
    json_data = {
        'status': github_user.status,
    }
    content = loader.render_to_string(
        'min_git_rainbow.html',
        context,
        request
    )
    return JsonResponse({"content": content, **json_data})


def git_rainbow_svg(request, github_id):
    github_user = GithubUser.objects.filter(github_id__iexact=github_id, is_valid=True).first()
    if not github_user:
        new_github_user, _ = GithubUser.objects.get_or_create(github_id=github_id)
        user_result = update_or_create_github_user(github_id)
        if user_result['status'] == 'fail':
            return render(request, 'exception_page.html', {'error': 404, 'message': user_result['reason']})
        github_user = user_result['github_user']
        github_id = github_user.github_id
        if new_github_user.github_id != github_id:
            new_github_user.delete()

    analysis_data = AnalysisData.objects.filter(github_id=github_user).first()

    if analysis_data:
        tech_card_data = json.loads(analysis_data.tech_card_data.replace("'", '"')) if analysis_data.tech_card_data else []
        calendar_data = json.loads(analysis_data.git_calendar_data.replace("'", '"')) if analysis_data.git_calendar_data else {}
    else:
        user_data = {"github_id": github_id, "tech_stack": True}
        core_response = core_repo_list(user_data, github_user.status)
        github_user.status = core_response['status']
        github_user.save()
        if core_response['status'] == 'fail':
            return redirect(f'/{github_id}')
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


def update_tech_stack_table(tech_set: set):
    today = timezone.now()
    year_ago = (today - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    techs_with_dev_count = GithubCalendar.objects.filter(tech_name__in=tech_set, lines__gt=0, author_date__gte=year_ago).values('tech_name').annotate(developer_count=Count('github_id', distinct=True))
    techs_dev_count_dict = {data['tech_name']:data['developer_count'] for data in techs_with_dev_count}
    tech_stack_list = TechStack.objects.filter(tech_name__in=tech_set)
    for tech in tech_stack_list:
        tech.developer_count = techs_dev_count_dict[tech.tech_name]
    TechStack.objects.bulk_update(tech_stack_list, ['developer_count'])


def make_ranker_data(tech_name):
    user_tech_data_list = list(CodeCrazy.objects.select_related('github_id', 'github_id__toptech').filter(tech_name=tech_name))
    github_id_set = {tech_data.github_id_id for tech_data in user_tech_data_list}
    total_lines = sum([tech_data.total_lines for tech_data in user_tech_data_list])
    total_ranker_count = len(github_id_set)
    user_avg_lines = (total_lines / total_ranker_count) * 2

    user_code_crazy_list = []
    for user_tech_data in user_tech_data_list:
        code_line_percent = round(user_tech_data.total_lines / user_avg_lines * 100, 2)
        if code_line_percent < 25:
            code_line_percent = 25
        elif code_line_percent > 95:
            code_line_percent = 95
        try:
            top_tech = user_tech_data.github_id.toptech.tech_name
        except GithubUser.toptech.RelatedObjectDoesNotExist:
            top_tech = "None"
        user_code_crazy_list.append({
            "github_id": user_tech_data.github_id_id,
            "avatar_url": user_tech_data.github_id.avatar_url,
            "top_tech": top_tech,
            "tech_name": tech_name,
            "total_lines": format(user_tech_data.total_lines, ','),
            "tech_code_crazy": user_tech_data.code_crazy,
            "int_code_crazy": int(user_tech_data.code_crazy),
            "code_line_percent": code_line_percent,
        })
    user_code_crazy_list.sort(key=lambda x: x['tech_code_crazy'], reverse=True)

    old_code_crazy = {tech_data.github_id_id: tech_data.old_code_crazy for tech_data in user_tech_data_list}
    sorted_old_code_crazy = sorted(old_code_crazy.items(), key=lambda x: x[1], reverse=True)
    old_rank_dict = {}
    rank = 0
    before_code_crazy = None
    for github_id, old_code_crazy in sorted_old_code_crazy:
        if before_code_crazy is None or before_code_crazy > old_code_crazy:
            rank += 1
        old_rank_dict[github_id] = rank

    row_num = 0
    current_rank = 0
    before_crazy = None
    for user_crazy in user_code_crazy_list:
        if before_crazy is None or before_crazy > user_crazy['tech_code_crazy']:
            current_rank += 1
            before_crazy = user_crazy['tech_code_crazy']
        row_num += 1
        user_crazy['rank'] = current_rank
        user_crazy['row_num'] = row_num
        last_rank = old_rank_dict.get(user_crazy['github_id'])
        user_crazy['change_rank'] = last_rank - current_rank if last_rank else total_ranker_count - current_rank
    return user_code_crazy_list


def make_top3_tech_date(tech_card_data, github_user):
    top3_tech_data = []
    for tech_data in tech_card_data[:3]:
        tech_rank_data = make_ranker_data(tech_data['name'])
        for rank_data in tech_rank_data:
            if rank_data['github_id'] == github_user.github_id:
                tech_data['rank'] = rank_data
                tech_data['ranker_num'] = len(tech_rank_data)
                tech_data['rank_percent'] = round(rank_data['rank'] / tech_data['ranker_num'] * 100, 1)
                top3_tech_data.append(tech_data)
                break
    return top3_tech_data


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


def save_github_calendar_data(git_calendar_data, github_user):
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

def __ranking_all():
    tech_side = draw_tech_side()
    sorted_github_calendar_colors = {tech_dict['tech_name']:{'tech_color': tech_dict['tech_color'], 'logo_path':tech_dict['logo_path']} for tech_dict_list in tech_side.values() for tech_dict in tech_dict_list}
    user_tech_data_list = list(CodeCrazy.objects.filter(tech_name__in=sorted_github_calendar_colors.keys()).order_by('tech_name', '-code_crazy'))

    user_code_crazy_list = []
    for user_data in user_tech_data_list:
        user_code_crazy_list.append({
            'github_id': user_data.github_id_id,
            'tech_name': user_data.tech_name,
            'total_lines': user_data.total_lines,
            "tech_code_crazy": user_data.code_crazy,
            "int_code_crazy": int(user_data.code_crazy),
        })

    RANK_COUNT_TO_SHOW = 3
    rank_data = dict()
    ranker_github_id_set = set()
    for tech, tech_data in sorted_github_calendar_colors.items():
        tech_name = tech.lower()
        tech_rank_data = [i for i in user_code_crazy_list if i['tech_name'].lower() == tech_name]
        tech_rank_data.sort(key=lambda x: x['tech_code_crazy'], reverse=True)
        top3_data = tech_rank_data[0:RANK_COUNT_TO_SHOW]
        user_avg_lines = sum(i['total_lines'] for i in top3_data)/RANK_COUNT_TO_SHOW
        for ranker in top3_data:
            ranker_github_id_set.add(ranker['github_id'])
            code_line_percent = round(ranker['total_lines'] / user_avg_lines * 100, 2)
            if code_line_percent < 50:
                code_line_percent = 50
            elif code_line_percent > 95:
                code_line_percent = 95
            ranker['code_line_percent'] = code_line_percent

        rank_data[tech] = {'color': tech_data['tech_color'], 'logo_path':tech_data['logo_path'], 'top3_data':top3_data}
    ranker_github_data_list = GithubUser.objects.values('github_id', 'avatar_url', 'toptech__tech_name').filter(github_id__in=ranker_github_id_set)
    rank_avatar_url_dict = {ranker['github_id']: ranker['avatar_url'] for ranker in ranker_github_data_list}
    ranker_toptech_dict = {ranker['github_id']: str(ranker['toptech__tech_name']) for ranker in ranker_github_data_list}
    context = {
        'tech_side': tech_side,
        'rank_data': rank_data,
        'rank_avatar_url_dict': rank_avatar_url_dict,
        'ranker_toptech_dict': ranker_toptech_dict,
    }
    return context


def ranking_all(request):
    context = __ranking_all()
    return render(request, 'ranking_all.html', context=context)


def ranking_info(request):
    context = __ranking_all()
    i = iter(context['rank_data'])
    tech = next(i)
    tech2 = next(i)
    context['rank_data'] = { tech : context['rank_data'][tech],
                             tech2 : context['rank_data'][tech2]}
    context['lang_cnt'] = sum(1 for tech_info in github_calendar_colors.values() if tech_info['tech_type'] == 'Language')
    context['tech_cnt'] = len(github_calendar_colors) - context['lang_cnt']
    context['developer_cnt'] = GithubUser.objects.count()

    return render(request, 'ranking_info.html', context=context)


def ranking_tech_stack(request, tech_name):
    if tech_name.lower() == 'c_sharp':
        tech_name = 'C#'

    current_tech = TechStack.objects.filter(tech_name__iexact=tech_name).first()
    if current_tech is None:
        return render(request, 'exception_page.html', {'error': 403, 'message': f'{tech_name} is not in service at this time'})

    now_ranker_data = make_ranker_data(tech_name)
    page_number = request.GET.get('page')
    items_per_page = 50
    search_user = request.GET.get('github_id')
    exist_search_user = None
    if search_user:
        github_user = GithubUser.objects.filter(github_id__iexact=search_user).first()
        if not github_user or not get_calendar_model(search_user).objects.filter(tech_name__iexact=tech_name).exists():
            exist_search_user = False
        else:
            exist_search_user = True
            search_user_page_number = 0
            origin_github_id = github_user.github_id
            for data in now_ranker_data:
                if data.get('github_id') == origin_github_id:
                    search_user_rank = data.get('row_num')
                    search_user_page_number = search_user_rank//items_per_page + 1
                    break
            page_number = search_user_page_number
    paginator = Paginator(now_ranker_data, items_per_page)
    page_rank_data = paginator.get_page(page_number)
    context = {
        'tech_side': draw_tech_side(),
        'tech_name': tech_name,
        'tech_color': current_tech.tech_color,
        'logo_path': current_tech.logo_path,
        'top_ranker': now_ranker_data[:3],
        'now_ranker_data': page_rank_data,
        'total_rank_count': format(current_tech.developer_count, ','),
        'search_user': search_user,
        'exist_search_user': exist_search_user,
    }
    if request.user.is_authenticated:
        context['login_user'] = request.user.githubuser_set.first()
        github_id = context['login_user'].github_id
        login_user_rank_data = [ranker_data for ranker_data in now_ranker_data if ranker_data['github_id'] == github_id]
        if login_user_rank_data:
            for ranker in now_ranker_data:
                if ranker['github_id'] == github_id:
                    context['login_user_rank'] = ranker['rank']
                    context['login_user_data'] = ranker
                    break

    return render(request, 'ranking.html', context)


def find_user_page(request, github_id):
    if request.method != 'POST':
        return render(request, 'exception_page.html', {'error': 403, 'message': 'Not allowed method'})

    tech_name = request.POST.get('tech_name')
    if not GithubUser.objects.filter(github_id__iexact=github_id).exists() or not get_calendar_model(github_id).objects.filter(tech_name__iexact=tech_name).exists():
        return JsonResponse({'exist': False})
    return JsonResponse({'exist': True})


def update_all_user_code_crazy(request):
    all_github_id_list = GithubUser.objects.all().values_list('github_id', flat=True)
    update_code_crazy(all_github_id_list)
    return JsonResponse({'status': 'success'})
