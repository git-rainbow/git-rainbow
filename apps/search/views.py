from django.shortcuts import render
from apps.developer.utils import draw_tech_side


def search_repo(request):
    return render(request, 'search_repo.html', {'tech_side': draw_tech_side()})
