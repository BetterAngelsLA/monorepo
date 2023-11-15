from _typeshed import Incomplete
from organizations.models import Organization as Organization, OrganizationUser as OrganizationUser

class OrganizationMixin:
    org_model = Organization
    org_context_name: str
    def get_org_model(self): ...
    def get_context_data(self, **kwargs): ...
    def organization(self): ...
    def get_object(self): ...
    get_organization = get_object

class OrganizationUserMixin(OrganizationMixin):
    user_model = OrganizationUser
    org_user_context_name: str
    def get_user_model(self): ...
    def get_context_data(self, **kwargs): ...
    def organization_user(self): ...
    def get_object(self): ...

class MembershipRequiredMixin:
    request: Incomplete
    args: Incomplete
    kwargs: Incomplete
    def dispatch(self, request, *args, **kwargs): ...

class AdminRequiredMixin:
    request: Incomplete
    args: Incomplete
    kwargs: Incomplete
    def dispatch(self, request, *args, **kwargs): ...

class OwnerRequiredMixin:
    request: Incomplete
    args: Incomplete
    kwargs: Incomplete
    def dispatch(self, request, *args, **kwargs): ...
