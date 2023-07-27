import json
import os
import random
from datetime import datetime

import requests
from dateutil.relativedelta import relativedelta
from django.db.models import Sum
from django.db.models.functions import Trunc

from config.local_settings import CORE_URL, token_list
from utils.github_calendar_colors import github_calendar_colors


def make_tech_card_data(tech_stack_files):
    tech_name_list = tech_stack_files.exclude(tech_type__in = ['Data', 'Other']).distinct().values_list('tech_name', flat=True)
    tech_data = {tech: 0 for tech in tech_name_list}
    total_line = 0
    for file in tech_stack_files:
        if tech_data.get(file.tech_name) is not None:
            tech_data[file.tech_name] += file.lines
            total_line += file.lines
    tech_data = sorted(tech_data.items(), key=lambda x: x[1], reverse=True)[:8]
    tech_card_data = []
    for tech_name, lines in tech_data:
        percent = round(lines / total_line * 100, 1)
        if percent > 0:
            name_for_file = tech_name.lower()
            tech = {'name': tech_name, 'file': name_for_file,
                    'color': github_calendar_colors.get(tech_name, 'rgba(7,141,169,1.0)'),
                    'percent': percent}
            img_list = os.listdir('static/img')
            if (f'{name_for_file}.png') not in img_list:
                tech['file'] = f'none{random.randint(1, 3)}'
            tech_card_data.append(tech)
    return tech_card_data


def make_calendar_data(tech_files):
    commit_date = tech_files.annotate(date=Trunc('author_date', 'day')).values('date').distinct()
    calendar_data = {}
    for date in commit_date:
        data = tech_files.exclude(tech_type='Data') \
            .filter(author_date__range=[date['date'], date['date'].replace(hour=23, minute=59, second=59)]) \
            .values("tech_name") \
            .annotate(lines=Sum('lines')) \
            .order_by('-lines')
        commit_data = dict(data.values_list('tech_name','lines')) if dict(data.values_list('tech_name','lines')) else 0
        calendar_data[date['date'].strftime("%Y-%m-%d")] = commit_data
    return calendar_data


def github_gql(query, variables, headers):
    """ used to request graphql.
    Args:
        query (str): Stored query string in graphql format
        variables (dict): Stored data using graphql query
        headers (dict): Stored data to be in html header on request
    Returns:
        dict: data containing the result of a request
    """
    req = requests.post('https://api.github.com/graphql', json={'query': query, 'variables': variables},
                        headers=headers)
    res = req.json()
    return res


def make_full_path(path: str, args: dict):
    """ Create a full path with path and args
    Args:
        path(str): Request path ex) user/repos
        args(dict or None): Optional dictionary containing query parameters.
                        ex) {'author': linuxgeek',
                            'per_page': '100'}
    Returns:
        full_path(str): ex) user/repos?visibility=private&affiliation=owner&since=2022-06-20&per_page=100&page=1
    """
    if args:
        query_str = '?'
        query_list = [f"{key}={val}" for key, val in args.items()]
        query_str += '&'.join(query_list)
    full_path = path + query_str
    return full_path


def github_rest_api(token: str, path: str, args: dict = None):
    """Sends a request to the GitHub REST API and receives a response.
    Args:
        token(str): GitHub authentication token.
                        ex) {'Authorization': 'Bearer ghp_ge2N4X...'}
        path(str): The path of the API to send a request to.
                        ex)'user/repos
        args(dict or None): Optional dictionary containing query parameters.
                        ex) {'author': linuxgeek',
                            'per_page': '100'}
    Returns: Status and JSON response from the GitHub API.
    """
    headers = {'Authorization': f'Bearer {token}'}
    try:
        if args and args.get('per_page'):
            api_response = []
            for i in range(5):
                args['page'] = i + 1
                full_path = make_full_path(path, args)
                page_response = requests.get(f"https://api.github.com/{full_path}", headers=headers).json()
                api_response.extend(page_response)
                if len(page_response) < 100:
                    break
        elif args:
            full_path = make_full_path(path, args)
            api_response = requests.get(f"https://api.github.com/{full_path}", headers=headers).json()
        else:
            api_response = requests.get(f"https://api.github.com/{path}", headers=headers).json()
    except Exception as e:
        print(e)
        api_response = None
    return api_response


def get_token():
    token = None
    for index in range(len(token_list)):
        res = github_rest_api(token_list[index], 'rate_limit')
        if res['resources']['core']['remaining'] > 200:
            token = token_list[index]
            break
    return token


def get_repo_list(variables, token):
    """ brings a committed repo of github id for one year
    Args:
        variables (dict): Stored data using graphql query
        headers (dict): Stored data to be in html header on request
    Returns:
        list: Stored repo infomation string
    """

    headers = {'Authorization': f'Bearer {token}'}

    query = """
    query($login: String!, $from: DateTime!, $to: DateTime!){
    user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository {
            repository {
            url
            nameWithOwner
            stargazerCount
            description
            defaultBranchRef {
                name
            }
            parent {
                nameWithOwner
                stargazerCount
                isFork
            }
            }
        }
        }
    }
    }
    """
    res = github_gql(query, variables, headers)

    try:
        dict_list = res['data']['user']['contributionsCollection']['commitContributionsByRepository']

        repo_list = dict()
        for repo_dict in dict_list:
            desc = repo_dict['repository']['description']
            if desc:
                desc = desc.replace("|", "/").strip().replace("\\", "\\\\")
            repo_list.update({
                repo_dict['repository']['url'] + ".git": {
                    "name_with_owner": repo_dict['repository']['nameWithOwner'],
                    "main_branch": repo_dict['repository']['defaultBranchRef']['name'],
                    "description": desc
                }
            })

        return repo_list
    except Exception as e:
        print(e)
        raise


def repo_list(github_id, ghp_token=None):
    today = datetime.today()
    gql_today = today.isoformat()
    from_year_ago = today - relativedelta(years=1)
    gql_from_year_ago = from_year_ago.isoformat()
    user_repo_list = dict()
    if ghp_token:
        args = {'visibility': 'private',
                'affiliation': 'owner',
                'since': f"{from_year_ago.year:04d}-{from_year_ago.month:02d}-{from_year_ago.day:02d}",
                'per_page': '100'}
        private_repo_data = github_rest_api(ghp_token, 'user/repos', args)
        for private_repo in private_repo_data:
            args = {'author': f'{github_id}',
                    'per_page': '100'}
            user_commit_data = github_rest_api(ghp_token, f'repos/{private_repo["full_name"]}/commits', args)
            if user_commit_data:
                repo_data = {
                    f'https://github.com/{private_repo["full_name"]}.git':
                        {
                            'name_with_owner': private_repo['full_name'],
                            'main_branch': private_repo['default_branch'],
                            'description': private_repo['description']
                        }
                }
                user_repo_list.update(repo_data)
    token = get_token()
    if token is None:
        print('No tokens available')
        raise
    try:
        n_year_variables = {
            "login": github_id,
            "from": gql_from_year_ago,
            "to": gql_today
        }
        user_repo_list.update(get_repo_list(n_year_variables, token))
    except Exception as e:
        print(e)
        raise
    repo_dict_list = []

    for user_repo in user_repo_list:
        repo_url = user_repo
        user_repo_dict = user_repo_list[user_repo]
        name_with_owner = user_repo_dict["name_with_owner"]
        main_branch = user_repo_dict["main_branch"]
        description = user_repo_dict["description"]
        repo_author = {
            "name_with_owner": name_with_owner,
            "main_branch": main_branch,
            "description": description,
            "repo_url": repo_url
        }
        repo_dict_list.append(repo_author)

    return repo_dict_list


def core_repo_list(user_data):
    user_data['repo_dict_list'] = json.dumps(repo_list(user_data['github_id'], user_data.get('ghp_token')))
    core_url = CORE_URL + "/core/tech-stack"
    data = user_data
    response = requests.post(core_url, data=data).json()
    return response
