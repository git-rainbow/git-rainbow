from django.shortcuts import render
from django.utils import timezone

from apps.tech_stack.models import GithubUser
from apps.users.models import User


def admin_page(request):
    all_member = User.objects.prefetch_related('githubuser_set').all().order_by('-date_joined')
    all_member_cnt = all_member.count()

    all_githubuser = GithubUser.objects.filter(user__isnull=True).order_by('-updated_date')
    all_githubuser_cnt = all_githubuser.count()

    now = timezone.now()
    first_day_of_this_month = now.replace(day=1, hour=0, minute=0, second=0)
    all_new_member = all_member.filter(date_joined__range=[first_day_of_this_month, now])
    all_new_member_cnt = all_new_member.count()

    context = {
        'all_member': all_member,
        'all_member_cnt': all_member_cnt,
        'all_githubuser': all_githubuser,
        'all_githubuser_cnt': all_githubuser_cnt,
        'all_new_member': all_new_member,
        'all_new_member_cnt': all_new_member_cnt,
    }
    return render(request, 'admin/admin_dashboard.html', context)
