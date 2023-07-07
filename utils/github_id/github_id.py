import re

def check_github_id(github_id):
    invalid_condition_list = [
        github_id.startswith('-'),
        github_id.endswith('-'),
        '--' in github_id,
        re.search(r'[^a-zA-Z0-9-]', github_id)
    ]
    if any(invalid_condition_list):
        return False
    return True
