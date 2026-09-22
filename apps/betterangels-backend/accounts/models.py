from typing import Any, ClassVar, cast

import pghistory
from accounts.managers import UserManager
from common.models import BaseModel
from django.contrib.auth.models import AbstractBaseUser, Group, Permission, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionAbstract, UserObjectPermissionAbstract
from organizations.models import Organization, OrganizationInvitation, OrganizationUser
from strawberry_django.descriptors import model_property


@pghistory.track(
    pghistory.InsertEvent("user.add"),
    pghistory.UpdateEvent("user.update"),
    pghistory.DeleteEvent("user.remove"),
)
class User(AbstractBaseUser, PermissionsMixin):
    username_validator = UnicodeUsernameValidator()

    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    last_name = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    username = models.CharField(
        ("username"),
        max_length=150,
        help_text=("Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."),
        validators=[username_validator],
        unique=True,
    )

    date_joined = models.DateTimeField(auto_now_add=True)
    has_accepted_privacy_policy = models.BooleanField(default=False)
    has_accepted_tos = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(
        ("active"),
        default=True,
        help_text=(
            "Designates whether this user should be treated as active. Unselect this instead of deleting accounts."
        ),
    )
    is_staff = models.BooleanField(
        ("staff status"),
        default=False,
        help_text=("Designates whether the user can log into this admin site."),
    )
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    organizations_organization: models.QuerySet[Organization]
    organizations_organizationuser: models.QuerySet[OrganizationUser]

    def __str__(self: "User") -> str:
        return f"{self.full_name if self.full_name else self.pk}"

    @model_property
    def full_name(self: "User") -> str:
        name_parts = filter(None, [self.first_name, self.middle_name, self.last_name])
        return " ".join(name_parts).strip()

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.email:
            self.email = self.email.lower()
        else:
            self.email = None

        super().save(*args, **kwargs)


class ExtendedOrganizationInvitation(OrganizationInvitation):
    accepted: models.BooleanField = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Organization Invitation"
        verbose_name_plural = "Organization Invitations"

    organization_invitation: OrganizationInvitation = models.OneToOneField(
        OrganizationInvitation,
        on_delete=models.CASCADE,
        parent_link=True,
        related_name="extended_invitation",
    )


class BigGroupObjectPermission(GroupObjectPermissionAbstract):
    # https://github.com/django-guardian/django-guardian/blob/77de2033951c2e6b8fba2ac6258defdd23902bbf/docs/configuration.rst#guardian_user_obj_perms_model
    id: models.BigAutoField = models.BigAutoField(editable=False, unique=True, primary_key=True)

    class Meta(GroupObjectPermissionAbstract.Meta):
        abstract = False
        indexes = [
            *GroupObjectPermissionAbstract.Meta.indexes,
            # TODO: Check if this field order is optimal
            models.Index(fields=["content_type", "object_pk", "group"]),
        ]


class BigUserObjectPermission(UserObjectPermissionAbstract):
    # https://github.com/django-guardian/django-guardian/blob/77de2033951c2e6b8fba2ac6258defdd23902bbf/docs/configuration.rst#guardian_group_obj_perms_model
    id: models.BigAutoField = models.BigAutoField(editable=False, unique=True, primary_key=True)

    class Meta(UserObjectPermissionAbstract.Meta):
        abstract = False
        indexes = [
            *UserObjectPermissionAbstract.Meta.indexes,
            # TODO: Check if this field order is optimal
            models.Index(fields=["content_type", "object_pk", "user"]),
        ]


class PermissionGroupTemplate(models.Model):
    """A role that :class:`PermissionGroup` scopes to an organization.

    Where its permissions come from depends on whether the code knows the role:

    * named in :data:`common.org_types.REGISTRY` — its
      :class:`~common.permissions.config.TemplateConfig` is authoritative, and
      ``permissions`` here is kept as a mirror of it.
    * created by hand in the admin — ``permissions`` here *is* the definition, and
      is left alone.

    Either way :func:`accounts.seed.sync_group_permissions` is what applies it to
    the ``auth.Group`` that actually grants the access, so a role defined once
    reaches every organization holding it.
    """

    name = models.CharField(max_length=255)
    permissions = models.ManyToManyField(Permission, blank=True)

    objects = models.Manager()

    def __str__(self) -> str:
        return self.name


class PermissionGroup(Group):
    """An ``auth.Group`` scoped to one organization and one role.

    It *is* the group rather than pointing at one, so the group cannot outlive
    it.  That matters because object-level permissions are assigned to the group
    (:func:`common.permissions.utils.assign_object_permissions`) and
    ``BigGroupObjectPermission`` cascades from it — an orphaned group would keep
    granting them with no row left to revoke through.  Inheritance makes the
    teardown a cascade Django's own collector performs, on a direct delete, a
    queryset delete and an organization cascade alike.

    ``name`` is the group's, and is the unique key built by :meth:`group_name`.
    The human role label is :attr:`label`.
    """

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="permission_groups",
    )
    template = models.ForeignKey(
        PermissionGroupTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    label = models.CharField(
        max_length=255,
        blank=True,
    )

    # django-stubs types ``Group.objects`` as ``GroupManager``, which is
    # ``Manager[Group]`` — inheriting it resolves every query on this model
    # against the parent's fields.  Overriding it is the only way to keep
    # ``PermissionGroup.objects.filter(organization=…)`` type-checked.
    objects: ClassVar[models.Manager["PermissionGroup"]] = models.Manager()  # type: ignore[assignment]

    class Meta:
        unique_together = (("organization", "template"),)
        constraints = [
            models.CheckConstraint(
                condition=Q(template__isnull=False) | ~Q(label=""),
                name="permission_group_has_template_or_label",
                violation_error_message="A permission group needs either a template or a label.",
            )
        ]

    def __str__(self) -> str:
        return self.label

    def clean(self) -> None:
        """Require a template or a label to identify the role.

        Both are optional individually, so the admin inline could otherwise save
        a row with neither — leaving its role segment empty and colliding with
        the next such row on the unique ``name``.

        Duplicates the *call* of the constraint above, not the rule: ``clean()``
        is what words the error on the inline, because ``_post_clean`` runs with
        ``validate_constraints=False``.  The constraint is the one that holds for
        ``objects.create()`` and ``get_or_create``, which never reach this.  Delete
        this method if the admin ever stops needing the field-level message.
        """
        if not self.template_id and not self.label:
            raise ValidationError("A permission group needs either a template or a label.")

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Name the row on creation, ignoring any name the caller supplied.

        The name is derived, never chosen — :meth:`group_name` is what keeps it
        unique.  Refreshing it afterwards belongs to
        :func:`accounts.services.reconcile_org_groups`, the only caller that can
        keep the name, the permissions and this row consistent.
        """
        if self.template and not self.label:
            self.label = self.template.name
        if not self.pk:
            self.name = self.group_name()
        super().save(*args, **kwargs)

    def group_name(self) -> str:
        """Return the ``auth.Group`` name for this row, e.g. ``Acme Housing [3] · Caseworker``.

        The pk is what makes the name unique — ``auth.Group.name`` is unique and
        ``Organization.name`` is not — and the organization's name rides alongside
        it because this string is the label in the group picker and the
        ``auth.Group`` changelist.  Organization first so those lists sort
        alphabetically by organization rather than by pk-as-string.

        Truncated to fit: ``Organization.name`` allows 200 characters and a
        hand-entered label 255, against ``auth.Group.name``'s 150.

        Nothing reads this as data — every lookup goes through ``PermissionGroup``
        — so :func:`accounts.services.reconcile_org_groups` refreshing it is
        enough.  A rename outside that path leaves the label stale until the next
        reconcile, which is only acceptable while nothing keys off it.
        """
        max_length = cast(int, Group._meta.get_field("name").max_length)
        role = self.template.name if self.template else self.label
        suffix = f" [{self.organization_id}] · {role}"
        budget = max(max_length - len(suffix), 0)
        return f"{self.organization.name[:budget]}{suffix}"[:max_length]


class Role(Group):
    """A named role.

    ``is_global=True`` roles are held directly in ``user.groups`` — the global
    tier, read through Django's ``has_perm``.  ``is_global=False`` roles are
    granted through :class:`Grant` rows and are always scoped to a
    ``Grant.scope_org``.

    Roles are code-owned (see the ``RoleDef`` config and ``accounts.services.sync_roles``),
    and the flag is never flipped by hand: ``permissions.E001`` / ``permissions.E002``
    make a scoped role in ``user.groups`` and a global role in a ``Grant`` into
    deploy-time errors.
    """

    is_global = models.BooleanField(default=False)

    # django-stubs types ``Group.objects`` as ``GroupManager`` — inheriting it
    # resolves every query on this model against the parent's fields.  Overriding
    # it keeps ``Role.objects`` type-checked (same reason as ``PermissionGroup``).
    objects: ClassVar[models.Manager["Role"]] = models.Manager()  # type: ignore[assignment]

    def __str__(self) -> str:
        return self.name


@pghistory.track(
    pghistory.InsertEvent("grant.add"),
    pghistory.UpdateEvent("grant.update"),
    pghistory.DeleteEvent("grant.remove"),
)
class Grant(models.Model):
    """Who holds which role, where — the only scoped authorization input.

    Exactly one principal — a user, or an organization delegating its authority
    to another organization's people — and exactly one scope: an organization,
    or an object once the object-grant arm is wired (``permissions.E003``).

    Design: ``docs/adr/0001-grant-based-authorization.md``.
    """

    # ── principal: exactly one ──
    principal_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="grants",
    )
    principal_org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="delegated_grants",
    )

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="grants")

    # ── scope: exactly one ──
    scope_org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="grants",
    )
    scope_object_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    scope_object_id = models.PositiveBigIntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(principal_user__isnull=False) ^ Q(principal_org__isnull=False),
                name="grant_has_exactly_one_principal",
                violation_error_message="A grant needs exactly one principal: a user or an organization.",
            ),
            models.CheckConstraint(
                condition=(Q(scope_org__isnull=False) & Q(scope_object_type__isnull=True))
                | (Q(scope_org__isnull=True) & Q(scope_object_type__isnull=False) & Q(scope_object_id__isnull=False)),
                name="grant_has_exactly_one_scope",
                violation_error_message="A grant needs exactly one scope: an organization or an object.",
            ),
            models.CheckConstraint(
                condition=Q(principal_org__isnull=True) | ~Q(principal_org=F("scope_org")),
                name="grant_org_principal_is_not_scope",
                violation_error_message="An organization cannot delegate a role to itself.",
            ),
            # Partial + NULLS NOT DISTINCT: the user index only holds user-principal
            # rows and the org index only org-principal rows (a user grant's NULL
            # principal_org must not collide with another user's grant), while the
            # NULLS NOT DISTINCT scope columns still dedupe org- and object-scoped
            # rows within each principal kind.
            models.UniqueConstraint(
                fields=["principal_user", "role", "scope_org", "scope_object_type", "scope_object_id"],
                condition=Q(principal_user__isnull=False),
                nulls_distinct=False,
                name="unique_user_grant",
            ),
            models.UniqueConstraint(
                fields=["principal_org", "role", "scope_org", "scope_object_type", "scope_object_id"],
                condition=Q(principal_org__isnull=False),
                nulls_distinct=False,
                name="unique_org_grant",
            ),
        ]

    def clean(self) -> None:
        """A Grant must hold a scoped Role and, when object-scoped, be writable (E002/E003/E006).

        * A global Role is held in ``user.groups`` (the global tier), never in a
          Grant — a row referencing one is inert at best and confusing at worst
          (mirrors ``permissions.E002``).
        * Object grants are user-principal only and may only target whitelisted
          models (ADR 0001 §2.5): an org-principal object grant would make
          per-record authority org-granular — the guardian shape this model
          deletes (mirrors ``permissions.E006``) — and nothing outside the
          object-grant whitelist is object-grantable until the arm is wired
          (mirrors ``permissions.E003``).

        Enforced here so every ``full_clean`` writer shares the rules: the grant
        services (which call ``full_clean`` before ``save``) and the admin
        ModelForm.  The ``permissions.E00x`` checks remain the deploy-time
        backstop for writers that skip ``clean()`` (e.g. ``loaddata``, the shell)
        — these cannot be database constraints because ``Role.is_global`` and the
        whitelist live on other tables/config.
        """
        super().clean()
        if self.role is not None and self.role.is_global:
            raise ValidationError(
                {
                    "role": (
                        "Global roles are held in user.groups, never in a Grant "
                        f"({self.role.name!r} — permissions.E002)."
                    )
                }
            )
        if self.scope_object_type is not None:
            from common.permissions.config import OBJECT_GRANT_WHITELIST, content_type_key

            if self.principal_org is not None:
                raise ValidationError(
                    {
                        "scope_object_type": (
                            "Object grants are user-principal only — an organization "
                            "cannot be granted an object (ADR 0001 §2.5, "
                            "permissions.E006)."
                        )
                    }
                )
            if content_type_key(self.scope_object_type) not in OBJECT_GRANT_WHITELIST:
                raise ValidationError(
                    {
                        "scope_object_type": (
                            f"{self.scope_object_type} is not on the object-grant "
                            "whitelist (permissions.E003) — object grants are not "
                            "wired yet."
                        )
                    }
                )

    def __str__(self) -> str:
        principal = self.principal_user or self.principal_org
        scope = self.scope_org or self.scope_object_type
        return f"{principal} · {self.role} → {scope}"


class OrgTypeChoices(models.TextChoices):
    OUTREACH = "outreach", "Outreach"
    SHELTER = "shelter", "Shelter"


class OrganizationProfile(BaseModel):
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    org_types = ArrayField(
        base_field=TextChoicesField(choices_enum=OrgTypeChoices),
    )

    objects = models.Manager()

    class Meta:
        indexes = [GinIndex(fields=["org_types"])]
        constraints = [
            models.CheckConstraint(
                condition=Q(org_types__len__gt=0),
                name="org_profile_has_org_type",
                violation_error_message="An organization must have at least one org type.",
            )
        ]

    def __str__(self) -> str:
        types = ", ".join(t.label for t in self.org_types)
        return f"{self.organization.name} ({types or 'no type'})"
