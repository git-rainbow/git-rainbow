from django.utils import timezone
from collections import defaultdict
from dateutil.relativedelta import relativedelta
from django.dispatch import Signal, receiver
from django.db.models import Max
from apps.tech_stack.models import TechStack, GithubUser, get_calendar_model
from utils.github_calendar_colors.github_calendar_colors import github_calendar_colors


@receiver(Signal())
def update_techstack_table(**kwargs):
    today = timezone.now()
    year_ago = (today - relativedelta(years=1)).replace(hour=0, minute=0, second=0)
    all_github_id_list = GithubUser.objects.all().values_list('github_id', flat=True)
    all_calendar_data_list = []
    for github_id in all_github_id_list:
        all_calendar_data_list.extend(get_calendar_model(github_id).objects.filter(
            author_date__gte=year_ago, lines__gt=0, tech_name__in=github_calendar_colors.keys()
        ).values(
            'tech_name', 'github_id'
        ).annotate(
            one_github_id=Max('github_id')
        ))

    tech_developer_set_dict = defaultdict(set)
    for tech_data in all_calendar_data_list:
        tech_developer_set_dict[tech_data["tech_name"]].add(tech_data["github_id"])
    exist_tech_set = set(TechStack.objects.all().values_list('tech_name', flat=True))
    delete_tech_set = exist_tech_set - set(tech_developer_set_dict.keys())
    TechStack.objects.filter(tech_name__in=delete_tech_set).delete()
    updated_tech_list = []
    for tech_name, developer_set in tech_developer_set_dict.items():
        _, created = TechStack.objects.update_or_create(
            tech_name = tech_name,
            defaults={
                'developer_count': len(developer_set),
                'tech_type': github_calendar_colors[tech_name]['tech_type'],
                'tech_color': github_calendar_colors[tech_name]['tech_color'],
                'logo_path': github_calendar_colors[tech_name]['logo_path']
            }
        )
        if created:
            updated_tech_list.append(tech_name)
    if len(updated_tech_list) != 0:
        print(f'Newly added techstack: {", ".join(updated_tech_list)}')
    if len(delete_tech_set) > 0:
        print(f'Delete techstack: {", ".join(delete_tech_set)}')
