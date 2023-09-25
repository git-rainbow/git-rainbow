from django.db.models import Count
from django.shortcuts import render
from django.utils import timezone

from apps.admins.models import PageRequest
from apps.tech_stack.models import GithubUser
from apps.users.models import User

from collections import defaultdict


def admin_page(request):
    all_member = list(User.objects.prefetch_related('githubuser_set').all().order_by('-date_joined'))
    all_member_cnt = len(all_member)

    now = timezone.now()
    first_day_of_this_month = now.replace(day=1, hour=0, minute=0, second=0)
    all_new_member = [member for member in all_member if member.date_joined > first_day_of_this_month]
    all_new_member_cnt = len(all_new_member)

    all_githubuser = list(GithubUser.objects.filter(user__isnull=True).values('avatar_url', 'github_id', 'updated_date').order_by('-updated_date')[:1000])
    all_githubuser_cnt = GithubUser.objects.filter(user__isnull=True).count()

    page_request_data = PageRequest.objects.all().values('request_type', 'date', 'count').annotate(
        unique_cnt=Count('access_client')
    ).order_by('request_type')
    access_data = defaultdict(lambda: {'count': 0, 'unique_cnt': 0})
    for data in page_request_data:
        access_data[data['request_type']]['count'] += data['count']
        access_data[data['request_type']]['unique_cnt'] += data['unique_cnt']
    context = {
        'all_member': all_member,
        'all_member_cnt': all_member_cnt,
        'all_githubuser': all_githubuser,
        'all_githubuser_cnt': all_githubuser_cnt,
        'all_new_member': all_new_member,
        'all_new_member_cnt': all_new_member_cnt,
        'access_data': dict(access_data),
    }
    return render(request, 'admin/admin_dashboard.html', context)
