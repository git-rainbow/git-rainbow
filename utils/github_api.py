import requests

from config.local_settings import token_list


def request_github_profile(github_id, token):
    users_api_url = f'https://api.github.com/users/{github_id}'
    header = token
    try:
        response = requests.get(users_api_url, headers=header)
    except Exception as e:
        return {'status': 'fail', 'result': 'Wrong URL'}

    response_json = response.json()
    message = response_json.get('message')
    if response.status_code == 404 and message == 'Not Found':
        return {'status': 'success', 'result': 'no user'}, github_id

    elif response.status_code != 200:
        return {'status': 'fail', 'result': 'request error'}, github_id

    elif message and 'API rate limit' in message or message == 'Bad credentials':
        return {'status': 'fail', 'result': 'token error'}, github_id
    else:
        info_list = ['email', 'name', 'avatar_url', 'bio']
        data = {'status': 'success', 'result': {info: response_json.get(info) for info in info_list}}
        github_id = response_json.get('login')
        return data, github_id
