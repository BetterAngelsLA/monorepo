from _typeshed import Incomplete
from django import forms
from organizations.backends import invitation_backend as invitation_backend
from organizations.models import Organization as Organization, OrganizationUser as OrganizationUser
from organizations.utils import create_organization as create_organization

class OrganizationForm(forms.ModelForm):
    owner: Incomplete
    request: Incomplete
    def __init__(self, request, *args, **kwargs) -> None: ...
    class Meta:
        model = Organization
        exclude: Incomplete
    def save(self, commit: bool = ...): ...
    def clean_owner(self): ...

class OrganizationUserForm(forms.ModelForm):
    class Meta:
        model = OrganizationUser
        exclude: Incomplete
    def clean_is_admin(self): ...

class OrganizationUserAddForm(forms.ModelForm):
    email: Incomplete
    request: Incomplete
    organization: Incomplete
    def __init__(self, request, organization, *args, **kwargs) -> None: ...
    class Meta:
        model = OrganizationUser
        exclude: Incomplete
    def save(self, *args, **kwargs): ...
    def clean_email(self): ...

class OrganizationAddForm(forms.ModelForm):
    email: Incomplete
    request: Incomplete
    def __init__(self, request, *args, **kwargs) -> None: ...
    class Meta:
        model = Organization
        exclude: Incomplete
    def save(self, **kwargs): ...

class SignUpForm(forms.Form):
    name: Incomplete
    slug: Incomplete
    email: Incomplete
