from collections import defaultdict

from django.db.models import Case, When, IntegerField

from apps.group.utils import make_group_calendar_data
from apps.tech_stack.models import TechStack


def draw_ranking_side()->dict:
    tech_stack_with_order = TechStack.objects.annotate(
        tech_type_order=Case(
            When(tech_type='Frontend', then=1),
            When(tech_type='Backend', then=2),
            When(tech_type='Mobile', then=3),
            When(tech_type='Database', then=4),
            When(tech_type='Devops', then=5),
            default=6,
            output_field=IntegerField()
        )
    ).order_by('tech_type_order','-developer_count').values('tech_name', 'tech_color', 'tech_type', 'developer_count', 'logo_path')
    ranking_side = defaultdict(list)
    for tech in tech_stack_with_order:
        ranking_side[tech['tech_type']].append({'tech_name':tech['tech_name'], 'tech_color':tech['tech_color'], 'logo_path':tech['logo_path']})
    return dict(ranking_side)


def make_last_tech_data(github_calendar_list):
    sorted_calendar_list = sorted(github_calendar_list, key=lambda calendar_data: calendar_data.author_date, reverse=True)
    last_day = sorted_calendar_list[0].author_date.replace(hour=0, minute=0, second=0)
    last_day_calendar_data_list = [calendar_data for calendar_data in sorted_calendar_list if calendar_data.author_date >= last_day]
    last_day_commit_data = make_group_calendar_data(last_day_calendar_data_list)
    return last_day_commit_data
