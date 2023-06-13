from django import template
import json

from apps.tech_stack.tech_img_base64 import tech_img_base64

register = template.Library()


@register.filter
def replace_special_char(value):
    return value.translate(str.maketrans({'#':'_sharp'}))


@register.filter
def get_tech_img_base64(tech):
    return tech_img_base64.get(tech)
