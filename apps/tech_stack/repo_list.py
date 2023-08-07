from datetime import datetime

from dateutil.relativedelta import relativedelta

from utils.github_api.github_api import github_rest_api
from utils.github_api.github_grahpgql import github_gql
from utils.utils import get_token


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


def repo_list(github_id, action, ghp_token=None):
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
                            'description': private_repo['description'],
                            'is_private': True,
                            'ghp_token': ghp_token
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
        is_private = user_repo_dict.get('is_private', False)
        ghp_token = user_repo_dict.get('ghp_token')
        repo_author = {
            "name_with_owner": name_with_owner,
            "main_branch": main_branch,
            "description": description,
            "repo_url": repo_url,
            "is_private": is_private,
            'ghp_token': ghp_token,
            "action": action,
        }
        repo_dict_list.append(repo_author)

    return repo_dict_list
