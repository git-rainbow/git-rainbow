import json
import os
import random

import requests
from django.db.models import Sum
from django.db.models.functions import Trunc

from apps.tech_stack.repo_list import repo_list
from config.local_settings import CORE_URL
from utils.github_calendar_colors import github_calendar_colors

from apps.tech_stack.models import GithubRepo

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


def github_repo_list(user_data, session_key):
    repo_list_result = repo_list(user_data['github_id'], user_data.get('ghp_token'))
    if repo_list_result.get('status') == 'fail':
        return repo_list_result
    repo_dict_list = repo_list_result['repo_dict_list']
    user_data['repo_dict_list'] = json.dumps(repo_dict_list)
    if not session_key:
        for repo in repo_dict_list:
            GithubRepo.objects.update_or_create(
                github_id_id=user_data['github_id'],
                repo_url=repo['repo_url'],
                defaults={
                    'branch': repo['main_branch'],
                    'description': repo['description'],
                    'added_type': 'Auto',
                    'is_private': repo['is_private'],
                    'is_reachable': True,
                }
            )
        repo_url_set = set(repo['repo_url'] for repo in repo_dict_list)
        user_all_repo_set = set(GithubRepo.objects.filter(github_id_id=user_data['github_id']).values_list('repo_url', flat=True))
        is_unreachable_set = user_all_repo_set - repo_url_set
        GithubRepo.objects.filter(github_id_id=user_data['github_id'], repo_url__in=is_unreachable_set).update(**{'is_reachable': False})
    return {'status': 'success'}
