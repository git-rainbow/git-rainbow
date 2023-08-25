import json
from collections import defaultdict
from urllib.parse import urlparse

import requests

from config.local_settings import CORE_URL


def make_name_with_owner(repo_url):
    return urlparse(repo_url[:-4]).path[1:]

def core_group_analysis(repo_dict_list, session_key=None):
    data = {
        "repo_dict_list": json.dumps(repo_dict_list),
        "session_key": session_key
    }
    core_url = CORE_URL + "/core/group"
    response = requests.post(core_url, data=data).json()
    return response


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
