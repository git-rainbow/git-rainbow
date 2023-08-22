import json

import requests

from config.local_settings import CORE_URL


def core_group_analysis(repo_dict_list, session_key=None):
    data = {
        "repo_dict_list": json.dumps(repo_dict_list),
        "session_key": session_key
    }
    core_url = CORE_URL + "/core/group"
    response = requests.post(core_url, data=data).json()
    return response
