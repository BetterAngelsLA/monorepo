from _typeshed import Incomplete
from django.db import models
from organizations.base import AbstractBaseInvitation as AbstractBaseInvitation, AbstractBaseOrganization as AbstractBaseOrganization, AbstractBaseOrganizationOwner as AbstractBaseOrganizationOwner, AbstractBaseOrganizationUser as AbstractBaseOrganizationUser, OrgMeta as OrgMeta
from organizations.fields import AutoCreatedField as AutoCreatedField, AutoLastModifiedField as AutoLastModifiedField, SlugField as SlugField
from organizations.signals import owner_changed as owner_changed, user_added as user_added, user_removed as user_removed

USER_MODEL: Incomplete
ORGS_TIMESTAMPED_MODEL: Incomplete

class SharedBaseModel(models.Model):
    created: Incomplete
    modified: Incomplete
    class Meta:
        abstract: bool

class AbstractOrganization(Incomplete):
    slug: Incomplete
    class Meta(AbstractBaseOrganization.Meta):
        abstract: bool
        verbose_name: Incomplete
        verbose_name_plural: Incomplete
    def get_absolute_url(self): ...
    def add_user(self, user, is_admin: bool = ...): ...
    def remove_user(self, user) -> None: ...
    def get_or_add_user(self, user, **kwargs): ...
    def change_owner(self, new_owner) -> None: ...
    def is_admin(self, user): ...
    def is_owner(self, user): ...

class AbstractOrganizationUser(Incomplete):
    is_admin: Incomplete
    class Meta(AbstractBaseOrganizationUser.Meta):
        abstract: bool
        verbose_name: Incomplete
        verbose_name_plural: Incomplete
    def delete(self, using: Incomplete | None = ...) -> None: ...
    def get_absolute_url(self): ...

class AbstractOrganizationOwner(Incomplete):
    class Meta:
        abstract: bool
        verbose_name: Incomplete
        verbose_name_plural: Incomplete
    def save(self, *args, **kwargs) -> None: ...

class AbstractOrganizationInvitation(Incomplete):
    class Meta:
        abstract: bool
