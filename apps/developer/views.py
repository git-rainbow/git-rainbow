from django.shortcuts import render


def main_page(request):
    return render(request, 'index.html')


def loading_page(request, github_id):
    return render(request, 'loading.html')
