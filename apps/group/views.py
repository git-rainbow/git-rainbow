from django.shortcuts import render, redirect
from apps.tech_stack.models import TechStack
from apps.developer.views import draw_ranking_side

def group(request, group_id):
    context = { 'group' : True }

    return render(request, 'group.html', context)

def group_list(request):
    ranking_side = draw_ranking_side()

    context = { 'group' : True,
                'ranking_side': ranking_side
    }

    return render(request, 'group_list.html', context)


def create_group(request):
    ranking_side = draw_ranking_side()

    context = { 'group' : True,
                'ranking_side': ranking_side
    }

    return render(request, 'new_group.html', context)
