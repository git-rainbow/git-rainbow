import requests

from config.local_settings import CORE_URL


def core_repo_list(user_data):
    core_url = CORE_URL+"/repo_list"
    data = user_data
    requests.post(core_url, data=data)
    pass
