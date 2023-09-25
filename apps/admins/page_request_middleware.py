import re

from django.utils import timezone

from apps.admins.models import ClientInfo, PageRequest


class page_request_middleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        group_pattern = r'^\/group/(\d+)$'
        github_id_pattern = r'^\/[\w\d-]+$'

        accessed_url = request.path.lower()
        request_type = None
        if accessed_url == '/':
            request_type = 'index'
        elif accessed_url.startswith('/ranking'):
            tech_name = accessed_url[1:].split('/')[1]
            if tech_name == 'info' or tech_name == 'all':
                request_type = 'ranking'
            else:
                request_type = accessed_url[1:]
        elif accessed_url.startswith('/group') and (accessed_url.endswith('list') or re.findall(group_pattern, accessed_url)):
            request_type = 'group'
        elif accessed_url.startswith('/search'):
            request_type = 'search'
        elif accessed_url != '/logout' and accessed_url != '/admins' and re.findall(github_id_pattern, accessed_url):
            request_type = 'github_id'
        if request_type:

            today = timezone.now().date()

            if 'HTTP_X_FORWARDED_FOR' in request.META:
                client_ip = request.META['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
            else:
                client_ip = request.META.get('REMOTE_ADDR')

            user = None
            if request.user.is_authenticated:
                user = request.user

            info_obj, _ = ClientInfo.objects.get_or_create(
                client_ip=client_ip,
                user=user
            )
            page_request_obj, _ = PageRequest.objects.get_or_create(
                date=today,
                request_type=request_type,
                defaults={
                    'count': 0,
                }
            )
            page_request_obj.access_client.add(info_obj)
            page_request_obj.count += 1
            page_request_obj.save()

        response = self.get_response(request)

        return response
