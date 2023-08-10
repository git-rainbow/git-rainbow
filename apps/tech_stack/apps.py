from django.apps import AppConfig


class TechStackConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tech_stack'

    def ready(self):
        from .techstack_update import update_techstack_table
        update_techstack_table()
