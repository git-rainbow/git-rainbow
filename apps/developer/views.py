import json
from datetime import datetime

import pytz
import requests

from dateutil.relativedelta import relativedelta
from django.core.paginator import Paginator
from django.db.models import Sum, F, Count, Max, Avg, OuterRef, Subquery, Window, FloatField, ExpressionWrapper, CharField
from django.db.models import Case, IntegerField, Value, When
from django.db.models.functions import Rank, RowNumber
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template import loader
from django.utils import timezone
from collections import defaultdict

from apps.tech_stack.models import GithubUser, AnalysisData, GithubCalendar, Ranking, GithubRepo, TechStack, TopTech
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
                                                               defaults={**github_data})
    return {'status': 'success', 'github_user': github_user}


def make_user_code_crazy(github_id):
    code_crazy = 0
    LOW_LIMIT = 300
    HIGH_LIMIT = 1000
    LOW_MULTIPLIER = 0.01
    HIGH_MULTIPLIER = 0.001
    BASIC_POINTS = 3
    MAX_POINTS = 3.7
    user_commit_data = GithubCalendar.objects.filter(github_id_id=github_id).values('author_date').annotate(total_lines=Sum('lines'))
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

    user_data = {"github_id": github_id, "tech_stack": True, "action": "update"}
    core_response = core_repo_list(user_data, github_user.status)
    github_user.status = core_response['status']
    github_user.save()
    if not analysis_data:
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

    code_crazy, int_code_crazy = make_user_code_crazy(github_user.github_id)

    context = {'github_user': github_user, 'tech_card_data': tech_card_data, 'calendar_data': calendar_data,
               'top3_tech_data': top3_tech_data, 'int_code_crazy': int_code_crazy, 'code_crazy': code_crazy}
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


def save_repo_url(request):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", "reason": "Not allowed method"})

    repo_url = request.POST.get("repo_url")
    try:
        res_code = requests.get(repo_url).status_code
        if res_code == 200:
            github_id = request.user.github_id
            GithubRepo.objects.update_or_create(github_id_id=github_id, repo_url=repo_url, defaults={'added_type':'by_user'})
    except Exception as e:
        res_code = 404
    return JsonResponse({"status": res_code})


def update_git_rainbow(request):
    if request.method != 'POST':
        return JsonResponse({"status": "fail", 'reason': 'Not allowed method'})
    github_user = GithubUser.objects.filter(github_id__iexact=request.POST.get('github_id')).first()
    if not github_user:
        return JsonResponse({"status": "fail", 'reason': 'No github id'})

    github_id = github_user.github_id
    user_data = {"github_id": github_id, "tech_stack": True}
    user_data['action'] = request.POST.get('action')
    ghp_token = request.POST.get('ghp_token')
    user_data['ghp_token'] = ghp_token
    user_status = github_user.status

    if ghp_token:
        check_user_token_result = check_user_token(github_id, ghp_token)
        if check_user_token_result.get('status') == 'fail':
            return JsonResponse(check_user_token_result)

    core_response = core_repo_list(user_data, user_status)
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
    save_github_calendar_data(calendar_data, github_user)
    calendar_data = json.loads(calendar_data)

    tech_set = set()
    for tech_dict in calendar_data.values():
        tech_set.update(tech_dict.keys())
    update_tech_stack_table(tech_set)

    if tech_card_data:
        TopTech.objects.update_or_create(github_id=github_user, defaults={'tech_name': tech_card_data[0]['name']})

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

    code_crazy, int_code_crazy = make_user_code_crazy(github_user.github_id)

    context = {
        'top3_tech_data': top3_tech_data,
        'github_user': github_user,
        'tech_card_data': tech_card_data,
        'code_crazy': code_crazy,
        'int_code_crazy': int_code_crazy
    }
    json_data = {
        'status': core_status,
        'calendar_data': calendar_data
    }
    last_day = github_user.githubcalendar_set.aggregate(last_day=Max('author_date'))['last_day']
    if last_day:
        last_day_commits_data = github_user.githubcalendar_set.filter(author_date=last_day)
        last_tech_data = str({last_day.strftime("%Y-%m-%d"): {data['tech_name']: data['lines'] for data in last_day_commits_data.values()}}).replace("'", '"')
        json_data["last_tech_data"] = last_tech_data
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
        core_response = core_repo_list(user_data, github_user.status)
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
    today = timezone.now()
    year_ago = (today - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    now_tech_ranker = GithubCalendar.objects.filter(tech_name__iexact=tech_name, author_date__range=[year_ago, today]).values('github_id').annotate(
        total_lines=Sum('lines'),
        tech_code_crazy=Sum(Case(
                When(lines__range=[300, 1000], then=(3+0.001*(F('lines')-300))),
                When(lines__gt=1000, then=Value(3.7)),
                default=F('lines')*0.01,
                output_field=FloatField()
        )),
        int_code_crazy=ExpressionWrapper(F('tech_code_crazy'), output_field=IntegerField()),
        avatar_url=F('github_id__avatar_url'),
        top_tech=Case(
            When(github_id__toptech__tech_name__isnull=True, then=Value('None')),
            default=F('github_id__toptech__tech_name'),
            output_field=CharField()
        ),
        midnight_rank=Subquery(Ranking.objects.filter(tech_name=OuterRef('tech_name'), github_id=OuterRef('github_id')).values('midnight_rank')),
        rank=Window(expression=Rank(), order_by=F('tech_code_crazy').desc()),
        row_num=Window(expression=RowNumber(), order_by=F('tech_code_crazy').desc()),
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


def draw_ranking_side(is_all=True)->dict:
    tech_stack_with_order = TechStack.objects.annotate(
        tech_type_order=Case(
            When(tech_type='Frontend', then=1),
            When(tech_type='Backend', then=2),
            When(tech_type='Mobile', then=3),
            When(tech_type='Database', then=4),
            When(tech_type='Devops', then=5),
            default=6,
            output_field=IntegerField()
        )
    ).order_by('tech_type_order','-developer_count').values('tech_name', 'tech_color', 'tech_type', 'developer_count')
    ranking_side = defaultdict(list)
    for tech in tech_stack_with_order:
        ranking_side[tech['tech_type']].append({'tech_name':tech['tech_name'], 'tech_color':tech['tech_color']})
    ranking_side = dict(ranking_side)

    if is_all:
        sorted_github_calendar_colors = {tech_dict['tech_name']:tech_dict['tech_color'] for tech_dict_list in ranking_side.values() for tech_dict in tech_dict_list}
        return ranking_side, sorted_github_calendar_colors

    return ranking_side


def ranking_all(request):
    today = timezone.now()
    year_ago = (today - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    ranking_side, sorted_github_calendar_colors = draw_ranking_side()
    tech_table_joined = list(GithubCalendar.objects.filter(author_date__gte=year_ago, tech_name__in=sorted_github_calendar_colors.keys()).values('github_id', 'tech_name').annotate(
        total_lines=Sum('lines'),
        tech_code_crazy=Sum(Case(
            When(lines__range=[300, 1000], then=(3 + 0.001 * (F('lines') - 300))),
            When(lines__gt=1000, then=Value(3.7)),
            default=F('lines') * 0.01,
            output_field=FloatField()
        )),
        int_code_crazy=ExpressionWrapper(F('tech_code_crazy'), output_field=IntegerField()),
    ))

    RANK_COUNT_TO_SHOW = 3
    rank_data = dict()
    ranker_github_id_set = set()
    for tech, tech_color in sorted_github_calendar_colors.items():
        tech_name = tech.lower()
        tech_rank_data = [i for i in tech_table_joined if i['tech_name'].lower() == tech_name]
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

        rank_data[tech] = {'color': tech_color, 'top3_data':top3_data}
    ranker_github_data_list = GithubUser.objects.values('github_id', 'avatar_url', 'toptech__tech_name').filter(github_id__in=ranker_github_id_set)
    rank_avatar_url_dict = {ranker['github_id']: ranker['avatar_url'] for ranker in ranker_github_data_list}
    ranker_toptech_dict = {ranker['github_id']: str(ranker['toptech__tech_name']) for ranker in ranker_github_data_list}
    context = {
        'ranking_side': ranking_side,
        'rank_data': rank_data,
        'rank_avatar_url_dict': rank_avatar_url_dict,
        'ranker_toptech_dict': ranker_toptech_dict,
    }
    return render(request, 'ranking_all.html', context=context)


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
        if not GithubCalendar.objects.filter(tech_name__iexact=tech_name, github_id=search_user).exists():
            exist_search_user = False
        else:
            exist_search_user = True
            search_user_page_number = 0
            for data in now_ranker_data:
                if data.get('github_id') == search_user:
                    search_user_rank = data.get('row_num')
                    search_user_page_number = search_user_rank//items_per_page + 1
                    break
            page_number = search_user_page_number
    paginator = Paginator(now_ranker_data, items_per_page)
    page_rank_data = paginator.get_page(page_number)
    context = {
        'ranking_side': draw_ranking_side(is_all=False),
        'tech_name': tech_name,
        'tech_color': current_tech.tech_color,
        'top_ranker': now_ranker_data[:3],
        'now_ranker_data': page_rank_data,
        'total_rank_count': format(current_tech.developer_count, ','),
        'search_user': search_user,
        'exist_search_user': exist_search_user,
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
    if not GithubCalendar.objects.filter(tech_name__iexact=tech_name, github_id=search_user).exists():
        return JsonResponse({'exist': False})
    return JsonResponse({'exist': True})
