from django import template

from apps.tech_stack.tech_img_base64 import tech_img_base64
from urllib.parse import urlparse

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
