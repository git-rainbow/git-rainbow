from django import template

from apps.tech_stack.tech_img_base64 import tech_img_base64
from urllib.parse import urlparse
from apps.tech_stack.models import GithubUser

register = template.Library()


@register.filter
def replace_special_char(value):
    return value.translate(str.maketrans({'#':'_sharp'}))


@register.filter
def get_tech_img_base64(tech):
    return tech_img_base64.get(tech)


@register.filter
def get_repo_name(repo_url):
    return urlparse(repo_url[:-4]).path[1:]


@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)


@register.filter
def get_owner_img(github_id):
    owner_img = GithubUser.objects.filter(github_id=github_id).first().avatar_url
    return owner_img


@register.filter
def startswith(value, arg):
    return str(value).startswith(str(arg))
