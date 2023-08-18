from django.dispatch import Signal, receiver
from django.db.models import Count
from apps.tech_stack.models import GithubCalendar, TechStack
from utils.github_calendar_colors.github_calendar_colors import github_calendar_colors


@receiver(Signal())
def update_techstack_table(**kwargs):
    tech_with_developer_count_query_dict = GithubCalendar.objects.\
        filter(lines__gt=0, tech_name__in=github_calendar_colors.keys()).\
        values('tech_name').\
        annotate(developer_count=Count('github_id', distinct=True))
    tech_developer_count_dict = {tech_data['tech_name']: tech_data['developer_count'] for tech_data in tech_with_developer_count_query_dict}

    updated_tech_list = []
    for tech_name, developer_count in tech_developer_count_dict.items():
        _, created = TechStack.objects.update_or_create(
            tech_name = tech_name,
            defaults={
                'developer_count': developer_count,
                'tech_type': github_calendar_colors[tech_name]['tech_type'],
                'tech_color': github_calendar_colors[tech_name]['tech_color'],
                'logo_path': github_calendar_colors[tech_name]['logo_path']
            }
        )
        if created:
            updated_tech_list.append(tech_name)
    if len(updated_tech_list) != 0:
        print(f'Newly added techstack: {", ".join(updated_tech_list)}')
