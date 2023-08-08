from django.shortcuts import render, redirect
from apps.tech_stack.models import TechStack
from apps.developer.views import draw_ranking_side

def group_list(request):
    ranking_side = draw_ranking_side()

    context = { 'group' : True,
                'ranking_side': ranking_side
    }

    return render(request, 'group_list.html', context)
