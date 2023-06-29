import requests

from config.local_settings import CORE_URL


def core_repo_list(user_data):
    core_url = CORE_URL+"/core/tech-stack"
    data = user_data
    response = requests.post(core_url, data=data).json()
    return response
