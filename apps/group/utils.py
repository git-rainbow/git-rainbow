import json
from collections import defaultdict
from urllib.parse import urlparse

import requests
from dateutil.relativedelta import relativedelta
from django.utils import timezone

from apps.tech_stack.models import TopTech, get_calendar_model
from apps.tech_stack.utils import core_repo_list
from config.local_settings import CORE_URL
from utils.github_calendar_colors.github_calendar_colors import github_calendar_colors


def save_git_calendar_data(git_calendar_data):
    calendar_data_dict = defaultdict(lambda: [])
    for git_data in git_calendar_data:
        calendar_data_dict[git_data['github_id_id']].append(git_data)

    for github_id, git_data_list in calendar_data_dict.items():
        calendar_model = get_calendar_model(github_id)
        calendar_data_bulk = [calendar_model(**git_data) for git_data in git_data_list]
        calendar_model.objects.bulk_create(calendar_data_bulk)


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


def core_user_analysis(github_user):
    year_ago = (timezone.now() - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    session_key = github_user.session_key
    if not session_key:
        github_user.status = 'progress'
        github_user.save()
        user_data = {"github_id": github_user.github_id, "tech_stack": True}
        repo_list_reponse = core_repo_list(user_data, session_key)
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
        calendar_model = get_calendar_model(github_user.github_id)
        calendar_model.objects.all().delete()
        save_git_calendar_data(core_response['calendar_data'])
        save_top_tech((core_response['calendar_data']), github_user.github_id)
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
