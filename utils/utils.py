from config.local_settings import token_list
from utils.github_api.github_api import github_rest_api


def get_token():
    token = None
    for index in range(len(token_list)):
        res = github_rest_api(token_list[index], 'rate_limit')
        if res['resources']['core']['remaining'] > 200:
            token = token_list[index]
            break
    return token
