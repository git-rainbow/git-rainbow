import concurrent
import json
from collections import defaultdict
from io import StringIO
from urllib.parse import urlparse

import requests
from dateutil.relativedelta import relativedelta
from django.db import connection
from django.db.models import Sum, Case, When, Value, F, FloatField
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.tech_stack.utils import github_repo_list
from apps.tech_stack.models import TopTech, get_calendar_model, CodeCrazy, GithubRepo

from config.local_settings import CORE_URL
from utils.github_calendar_colors.github_calendar_colors import github_calendar_colors


def save_git_calendar_data(git_calendar_data):
    calendar_data_dict = defaultdict(lambda: [])
    for git_data in git_calendar_data:
        calendar_data_dict[git_data['github_id_id']].append(git_data)

    for github_id, git_data_list in calendar_data_dict.items():
        calendar_model = get_calendar_model(github_id)

        # Assuming you have a list of data to insert
        data = [(git_data['author_date'], git_data['tech_name'], git_data['lines'], git_data['repo_url'], git_data['commit_hash'], git_data['github_id_id']) for git_data in git_data_list]

        # Create a StringIO object to prepare the data
        data_buffer = StringIO()

        # Write the data to the buffer
        for item in data:
            data_buffer.write('\t'.join(map(str, item)) + '\n')

        # Move the buffer's cursor to the beginning
        data_buffer.seek(0)

        # Use the PostgreSQL COPY command to insert the data
        with connection.cursor() as cursor:
            cursor.copy_from(data_buffer, calendar_model._meta.db_table, columns=('author_date', 'tech_name', 'lines', 'repo_url', 'commit_hash', 'github_id_id'))


def make_name_with_owner(repo_url):
    return urlparse(repo_url[:-4]).path[1:]


def code_crazy_calculation_by_tech(tech_data_dict):
    total_code_crazy = 0
    tech_code_crazy_dict = defaultdict(lambda: 0)
    for tech, tech_data in tech_data_dict.items():
        for date, lines in tech_data.items():
            if lines > 1000:
                code_crazy = 3.7
            elif 300 <= lines <= 1000:
                code_crazy = 3 + (0.001 * (lines - 300))
            else:
                code_crazy = lines * 0.01
            tech_code_crazy_dict[tech] += code_crazy
            total_code_crazy += code_crazy
    return total_code_crazy, tech_code_crazy_dict


def save_top_tech(calendar_data, github_id):
    tech_data_dict = defaultdict(lambda: defaultdict(lambda: 0))
    for data in calendar_data:
        if data['tech_name'] in github_calendar_colors.keys():
            date = data['author_date'].split('T')[0]
            tech_data_dict[data['tech_name']][date] += data['lines']
    if tech_data_dict:
        total_code_crazy, tech_code_crazy_dict = code_crazy_calculation_by_tech(tech_data_dict)
        sorted_crazy_dict = list(sorted(tech_code_crazy_dict.items(), key=lambda tech_data: tech_data[1], reverse=True))
        TopTech.objects.update_or_create(
            github_id_id=github_id,
            defaults={
                'tech_name': sorted_crazy_dict[0][0],
            })

def core_group_analysis(repo_dict_list, session_key):
    data = {
        "repo_dict_list": json.dumps(repo_dict_list),
        "session_key": session_key
    }
    core_url = CORE_URL + "/core/group"

    core_response = requests.post(core_url, data=data).json()
    return core_response


def _update_code_crazy(github_id, year_ago, six_months_ago):
    user_calendar_data_list = list(get_calendar_model(github_id).objects.filter(
        author_date__gte=year_ago, tech_name__in=github_calendar_colors.keys()
    ).values(
        'github_id', 'tech_name'
    ).annotate(
        date_without_time=TruncDate('author_date'),
        day_lines=Sum('lines'),
        tech_code_crazy=Case(
            When(day_lines__range=[300, 1000], then=(3 + 0.001 * (F('day_lines') - 300))),
            When(day_lines__gt=1000, then=Value(3.7)),
            default=F('day_lines') * 0.01,
            output_field=FloatField()
        ),
    ))
    user_code_crazy_dict = defaultdict(lambda: defaultdict(lambda: {'total_lines': 0, "tech_code_crazy": 0, "old_code_crazy": 0}))
    for joined_data in user_calendar_data_list:
        github_id = joined_data['github_id']
        tech_name = joined_data['tech_name']
        tech_code_crazy = joined_data['tech_code_crazy']
        lines = joined_data['day_lines']
        user_code_crazy_dict[github_id][tech_name]['total_lines'] += lines
        user_code_crazy_dict[github_id][tech_name]['tech_code_crazy'] += tech_code_crazy
        if six_months_ago.date() >= joined_data['date_without_time']:
            user_code_crazy_dict[github_id][tech_name]['old_code_crazy'] += tech_code_crazy

    user_code_crazy_list = []
    for user, user_data in user_code_crazy_dict.items():
        for tech_name, tech_data in user_data.items():
            user_code_crazy_list.append({
                "github_id_id": user,
                "tech_name": tech_name,
                "total_lines": tech_data['total_lines'],
                "code_crazy": tech_data['tech_code_crazy'],
                "old_code_crazy": tech_data['old_code_crazy']
            })
    CodeCrazy.objects.filter(github_id_id=github_id).delete()
    bulk_code_crazy = [CodeCrazy(**crazy_data)for crazy_data in user_code_crazy_list]
    CodeCrazy.objects.bulk_create(bulk_code_crazy)


def update_code_crazy(github_id_list):
    today = timezone.now()
    year_ago = (today - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    six_months_ago = year_ago + relativedelta(months=6)
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(_update_code_crazy, github_id, year_ago, six_months_ago) for github_id in github_id_list]
    concurrent.futures.wait(futures)


def core_user_analysis(github_user):
    year_ago = (timezone.now() - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    session_key = github_user.session_key
    github_id = github_user.github_id
    if not session_key:
        github_user.status = 'progress'
        github_user.save()
        user_data = {"github_id": github_id, "tech_stack": True}
        repo_list_reponse = github_repo_list(user_data, session_key)
        repo_list_status = repo_list_reponse['status']
        if repo_list_status == 'fail':
            github_user.status = repo_list_status
            github_user.save()
            return {"status": "fail", 'repo_list_status': 'fail', 'reason': str(repo_list_reponse.get('reason'))}

    user_repo_list = list(github_user.githubrepo_set.all())
    repo_dict_list = make_group_repo_dict_list([github_user], user_repo_list, year_ago.strftime("%Y-%m-%d"))

    data = {
        "repo_dict_list": json.dumps(repo_dict_list),
        "session_key": session_key
    }
    core_url = CORE_URL + "/core/group"
    core_response = requests.post(core_url, data=data).json()
    core_status = core_response['status']

    if core_status == 'fail':
        github_user.session_key = None
        github_user.status = 'fail'
        github_user.save()
        return {"status": "fail", 'reason': str(core_response.get('reason'))}

    elif core_status == 'progress':
        if not github_user.session_key:
            github_user.session_key = core_response['session_key']
            github_user.save()
        return {"status": "progress", "session_key": github_user.session_key}

    elif core_status == 'done':
        update_user_repo_list = []
        user_repo_list = list(GithubRepo.objects.filter(github_id_id__in=core_response['is_reachable_data'].keys()))
        for repo_obj in user_repo_list:
            try:
                repo_obj.is_reachable = core_response['is_reachable_data'][repo_obj.github_id_id][repo_obj.repo_url]
                update_user_repo_list.append(repo_obj)
            except:
                continue
        GithubRepo.objects.bulk_update(update_user_repo_list, ['is_reachable'])

        calendar_model = get_calendar_model(github_id)
        calendar_model.objects.all().delete()
        save_git_calendar_data(core_response['calendar_data'])
        save_top_tech((core_response['calendar_data']), github_id)
        update_code_crazy([github_id])
        github_user.session_key = None
        github_user.status = 'completed'
        github_user.save()
        return {"status": "completed"}
    else:
        return {"status": "fail", 'reason': 'invalid status'}


def make_group_calendar_data(group_calendar_data):
    group_git_calendar_data = defaultdict(lambda: defaultdict(lambda: {"total_lines": 0, "commit_repo": defaultdict(list)}))
    for i in group_calendar_data:
        commit_date = i.author_date.strftime("%Y-%m-%d")
        tech_info = group_git_calendar_data[commit_date][i.tech_name]
        tech_info["total_lines"] += i.lines
        commit_info = {
            "commit_hash": i.commit_hash,
            "github_id": i.github_id_id,
            "lines": i.lines,
            "avatar_url": i.github_id.avatar_url
        }
        tech_info["commit_repo"][i.repo_url].append(commit_info)
    return group_git_calendar_data


def make_group_repo_dict_list(member_list, repo_list, after):
    repo_dict_list = [
        {
            'name_with_owner': make_name_with_owner(group_repo.repo_url),
            'repo_url': group_repo.repo_url,
            'main_branch': group_repo.branch,
            'is_private': group_repo.is_private,
            'ghp_token': None,
            'after': after,
            'github_id': member.github_id
        }
        for group_repo in repo_list
        for member in member_list
    ]
    return repo_dict_list
