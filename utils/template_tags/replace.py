from django import template
import json


register = template.Library()


@register.filter
def replace_special_char(value):
    return value.translate(str.maketrans({'#':'_sharp'}))
