"""
URL configuration for betterangels_backend project.

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

from betterangels_backend import settings
from common.graphql.views import ProtectedGraphQLView
from common.models import Attachment, AttachmentModelForm
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic.base import TemplateView

from .schema import schema
from .views import FormsetModelFormView

urlpatterns = [
    path("", TemplateView.as_view(template_name="home.html"), name="home"),
    path("", include("accounts.urls")),
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls"), name="accounts"),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path("graphql", ProtectedGraphQLView.as_view(schema=schema)),
    path("legal/", include("legal.urls")),
    path("proxy/", include("proxy.urls"), name="proxy"),
    path("attachment_upload/", FormsetModelFormView.as_view(form_class=AttachmentModelForm, model=Attachment)),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
