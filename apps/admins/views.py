from django.db.models import Count, Prefetch
from django.shortcuts import render
from django.utils import timezone

from apps.admins.models import PageRequest, ClientInfo
from apps.tech_stack.models import GithubUser, TechStack
from apps.users.models import User

from collections import defaultdict
from datetime import date, timedelta


def admin_page(request):
    all_member = list(User.objects.prefetch_related('githubuser_set').all().order_by('-date_joined'))
    all_member_cnt = len(all_member)

    now = timezone.now()
    first_day_of_this_month = now.replace(day=1, hour=0, minute=0, second=0)
    all_new_member = [member for member in all_member if member.date_joined > first_day_of_this_month]
    all_new_member_cnt = len(all_new_member)

    all_githubuser = list(GithubUser.objects.filter(user__isnull=True).values('avatar_url', 'github_id', 'updated_date').order_by('-updated_date')[:1000])
    all_githubuser_cnt = GithubUser.objects.filter(user__isnull=True).count()
    tech_name_list = TechStack.objects.values_list('tech_name', flat=True)
    lower_tech_name_list = []
    request_type_list = ['github_id', 'group', 'index', 'ranking', 'search']

    for tech in tech_name_list:
        if tech == 'C#':
            tech = 'c_sharp'
        lower_tech_name = tech.lower()
        lower_tech_name_list.append(lower_tech_name)
        request_type_list.append(f'ranking/{lower_tech_name}')
    period = request.GET.get('period')
    if not period or period == 'all':
        page_request_queryset = PageRequest.objects.filter(request_type__in=request_type_list)
    else:
        period = int(period)
        end_date = date.today()
        start_date = end_date - timedelta(days=period)
        page_request_queryset = PageRequest.objects.filter(request_type__in=request_type_list, date__range=(start_date, end_date))
    page_request_data = page_request_queryset.values('request_type', 'date', 'count').annotate(
        unique_cnt=Count('access_client')
    )
    access_data = defaultdict(lambda: {'count': 0, 'unique_cnt': 0, 'access_user_data': [], 'logo_path': None})
    for data in page_request_data:
        access_data[data['request_type']]['count'] += data['count']
        access_data[data['request_type']]['unique_cnt'] += data['unique_cnt']
        if data['request_type'].startswith('ranking/'):
            tech_name = data['request_type'].split('ranking/')[1]
            if tech_name in lower_tech_name_list:
                logo_path = f'/static/img/{tech_name}.png'
                access_data[data['request_type']]['logo_path'] = logo_path

    access_client_queryset = ClientInfo.objects.select_related('user')
    request_data_list = list(PageRequest.objects.filter(request_type__in=request_type_list).prefetch_related(
        Prefetch('access_client', queryset=access_client_queryset)
    ).all())
    for request_data in request_data_list:
        for client in request_data.access_client.all():
            access_data[request_data.request_type]['access_user_data'].append({request_data.date: client})
    access_data = sorted(access_data.items(), key=lambda x: (-x[1]['unique_cnt'], x))

    context = {
        'all_member': all_member,
        'all_member_cnt': all_member_cnt,
        'all_githubuser': all_githubuser,
        'all_githubuser_cnt': all_githubuser_cnt,
        'all_new_member': all_new_member,
        'all_new_member_cnt': all_new_member_cnt,
        'access_data': dict(access_data),
        'period': period,
    }
    return render(request, 'admin/admin_dashboard.html', context)
