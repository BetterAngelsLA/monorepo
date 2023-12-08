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


from typing import Any, Union

from django.contrib import admin
from django.urls import include, path
from django.views.generic.base import TemplateView
from strawberry.django.views import GraphQLView

from .schema import schema

# class ProtectedGraphQLView(GraphQLView):
#     """
#     This subclass of GraphQLView is used to remove the CSRF exemption that is
#     applied by default in Strawberry Django's GraphQLView. Strawberry Django
#     typically exempts GraphQL views from CSRF checks to facilitate API interactions
#     from various origins or clients. However, this exemption might not be desirable
#     in all cases, especially when there's a need for increased security.

#     By subclassing GraphQLView and not applying the @csrf_exempt decorator,
#     this class effectively reinstates the default CSRF protection provided by Django.
#     """

#     def dispatch(
#         self, request: HttpRequest, *args: Any, **kwargs: Any
#     ) -> Union[HttpResponseNotAllowed, TemplateResponse, HttpResponse]:
#         try:
#             return self.run(request=request)
#         except HTTPException as e:
#             return HttpResponse(
#                 content=e.reason,
#                 status=e.status_code,
#             )


urlpatterns = [
    path("", TemplateView.as_view(template_name="home.html"), name="home"),
    path("", include("accounts.urls")),
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls"), name="accounts"),
    path("graphql", GraphQLView.as_view(schema=schema)),
]
