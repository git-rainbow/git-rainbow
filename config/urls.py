"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.views.i18n import JavaScriptCatalog
from apps.developer.views import exception_view

handler404 = exception_view
handler500 = exception_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.admins.urls')),
    path('', include('apps.users.urls')),
    path('', include('apps.developer.urls')),
    path('', include('apps.group.urls')),
]

urlpatterns += i18n_patterns(
    path('', include('apps.developer.urls')),
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog')
) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
