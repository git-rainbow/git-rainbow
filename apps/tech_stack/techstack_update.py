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

    existing_techstack_list = TechStack.objects.all()
    for techstack in existing_techstack_list:
        tech_name = techstack.tech_name
        techstack.tech_type = github_calendar_colors[tech_name]['tech_type']
        techstack.tech_color = github_calendar_colors[tech_name]['tech_color']
        techstack.logo_path = github_calendar_colors[tech_name]['logo_path']
        techstack.developer_count = tech_developer_count_dict[tech_name]
    TechStack.objects.bulk_update(existing_techstack_list, ['tech_type', 'tech_color', 'logo_path', 'developer_count'])

    all_developer_tech_set = set(tech_developer_count_dict.keys())
    exsiting_techstack_tech_name_set = {tech.tech_name for tech in existing_techstack_list}
    new_tech_name_set = all_developer_tech_set - exsiting_techstack_tech_name_set

    new_techstack_list = [
        TechStack(
            tech_name=tech_name,
            tech_type=github_calendar_colors[tech_name]['tech_type'],
            tech_color=github_calendar_colors[tech_name]['tech_color'],
            logo_path =github_calendar_colors[tech_name]['logo_path'], 
            developer_count=tech_developer_count_dict[tech_name],
        )
        for tech_name in new_tech_name_set
    ]
    TechStack.objects.bulk_create(new_techstack_list)
    if len(new_techstack_list) != 0:
        print(f'Newly added techstack: {", ".join(tech_name for tech_name in new_tech_name_set)}')
