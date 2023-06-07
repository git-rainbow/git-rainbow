import os
import random
from django.db.models import Sum
from django.db.models.functions import Trunc
from utils.git_analysis.calendar import git_calendar_colors


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
                    'color': git_calendar_colors.get(tech_name, 'rgba(7,141,169,1.0)'),
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
