from _typeshed import Incomplete
from django.db import models
from django.db.models.base import ModelBase
from organizations import signals as signals
from organizations.managers import ActiveOrgManager as ActiveOrgManager, OrgManager as OrgManager

USER_MODEL: Incomplete

class UnicodeMixin: ...

class OrgMeta(ModelBase):
    module_registry: Incomplete
    def __new__(cls, name, bases, attrs): ...
    def update_org(cls, module) -> None: ...
    def update_org_users(cls, module) -> None: ...
    def update_org_owner(cls, module) -> None: ...
    def update_org_invite(cls, module) -> None: ...

class AbstractBaseOrganization(models.Model):
    name: Incomplete
    is_active: Incomplete
    objects: Incomplete
    active: Incomplete
    class Meta:
        abstract: bool
        ordering: Incomplete
    @property
    def user_relation_name(self): ...
    def is_member(self, user): ...

class OrganizationBase(Incomplete):
    class Meta(AbstractBaseOrganization.Meta):
        abstract: bool
    def add_user(self, user, **kwargs): ...

class AbstractBaseOrganizationUser(models.Model):
    class Meta:
        abstract: bool
        ordering: Incomplete
        unique_together: Incomplete
    @property
    def name(self): ...

class OrganizationUserBase(Incomplete):
    class Meta(AbstractBaseOrganizationUser.Meta):
        abstract: bool

class AbstractBaseOrganizationOwner(models.Model):
    class Meta:
        abstract: bool

class OrganizationOwnerBase(Incomplete):
    class Meta(AbstractBaseOrganizationOwner.Meta):
        abstract: bool

class AbstractBaseInvitation(models.Model):
    guid: Incomplete
    invitee_identifier: Incomplete
    class Meta:
        abstract: bool
    def save(self, **kwargs): ...
    def get_absolute_url(self): ...
    def activation_kwargs(self): ...
    invitee: Incomplete
    def activate(self, user): ...
    def invitation_token(self) -> None: ...

class OrganizationInvitationBase(Incomplete):
    class Meta(AbstractBaseInvitation.Meta):
        abstract: bool
