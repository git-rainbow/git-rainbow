import requests

from config.local_settings import token_list


def _request_github_profile(github_id, token):
    users_api_url = f'https://api.github.com/users/{github_id}'
    header = {'Authorization': f'token {token}'}
    try:
        response = requests.get(users_api_url, headers=header)
    except Exception as e:
        return {'status': 'fail', 'result': 'Wrong URL'}, github_id
    response_json = response.json()
    message = response_json.get('message')
    if response.status_code == 404 and message == 'Not Found':
        return {'status': 'fail', 'result': 'There is not that user in github.'}, github_id

    elif response.status_code != 200:
        return {'status': 'fail', 'result': 'Request error occured.'}, github_id

    elif message and 'API rate limit' in message or message == 'Bad credentials':
        return {'status': 'fail', 'result': 'API token limited.'}, github_id

    elif response_json['type'] == 'Organization':
        return {'status': 'fail', 'result': "Organization account can't be analyzed"}, github_id

    else:
        info_list = ['email', 'name', 'avatar_url', 'bio']
        data = {'status': 'success', 'result': {info: response_json.get(info) for info in info_list}}
        github_id = response_json.get('login')
        return data, github_id


def request_github_profile(github_id, token=None):
    if token:
        return _request_github_profile(github_id, token)

    for index in range(len(token_list)):
        github_data, github_id = _request_github_profile(github_id, token_list[index])
        if github_data['result'] == 'API token limited.' and len(token_list) - 1 != index:
            continue
        break
    return github_data, github_id


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
