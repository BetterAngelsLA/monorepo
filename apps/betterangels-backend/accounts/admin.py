from collections.abc import Callable
from typing import Any, Type, cast

from common.org_types import REGISTRY
from common.permissions.config import TemplateConfig
from django.contrib import admin, messages
from django.contrib.admin import ModelAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User as DefaultUser
from django.contrib.sites.models import Site
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import Model, QuerySet
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.urls import URLPattern, path, reverse
from django.utils.html import format_html, format_html_join
from organizations.models import Organization, OrganizationInvitation, OrganizationOwner, OrganizationUser

from .forms import (
    OrganizationMemberInviteForm,
    OrganizationMemberRoleForm,
    PermissionGroupInlineForm,
    OrganizationProfileForm,
    UserChangeForm,
    UserCreationForm,
)
from .selectors import member_role_names, role_names_by_organization
from .models import (
    ExtendedOrganizationInvitation,
    OrganizationProfile,
    PermissionGroup,
    PermissionGroupTemplate,
    User,
)
from .services import (
    invitation_role,
    member_invite,
    member_roles_replace,
    organization_remove_member,
    reconcile_org_groups,
)


def _change_roles_link(obj: OrganizationUser) -> str:
    url = reverse(
        "admin:organizations_organization_change_member_roles",
        args=[obj.organization_id, obj.user_id],
    )
    return format_html('<a href="{}" class="changelink">Change roles</a>', url)


def _invited_message(email: str, organization: Organization, role_templates: tuple[TemplateConfig, ...]) -> str:
    """Name the roles granted, and which one the invitation email came from.

    Only one email is sent, so when several roles are granted the choice is
    stated rather than left to be guessed.
    """
    roles = ", ".join(template.name for template in role_templates)
    message = f"Invited {email} to {organization.name} as {roles}."
    if len(role_templates) > 1:
        message += f" Invitation email sent for {invitation_role(role_templates).name}."
    return message


admin.site.unregister(Organization)
admin.site.unregister(OrganizationUser)
admin.site.unregister(OrganizationInvitation)


@admin.register(PermissionGroup)
class PermissionGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "group", "template")
    list_filter = ("organization", "template")
    # Excludes ``group``: picking an existing one means deleting this row takes that
    # group's members with it.
    fields = ("organization", "template", "name")


@admin.register(PermissionGroupTemplate)
class PermissionGroupTemplateAdmin(admin.ModelAdmin):
    list_display = [
        "name",
    ]
    search_fields = [
        "name",
    ]


class PermissionGroupInline(admin.TabularInline):
    model = PermissionGroup
    form = PermissionGroupInlineForm
    extra = 1
    fields = ("template", "name")


class OrganizationMemberInline(admin.TabularInline[OrganizationUser, Organization]):
    """Who belongs to this organization, and with which roles.

    Read-only: adding goes through **Add member** so roles are always chosen, and
    removing stays on the Organization user page, where the owner guard lives.  An
    inline could not gate deletion per row anyway — ``has_delete_permission``
    receives the parent organization, not the member.
    """

    model = OrganizationUser
    extra = 0
    can_delete = False
    verbose_name_plural = "Members"
    # django-organizations' models define get_absolute_url against its own generic
    # views, which accounts/urls.py deliberately does not route, so reversing it
    # raises NoReverseMatch. Offering "View on site" would error.
    view_on_site = False

    fields = ("member", "roles", "owner", "created", "change_roles")
    readonly_fields = fields

    # django-stubs declares this two-arg form on InlineModelAdmin carrying its own
    # ignore[override], because it conflicts with BaseModelAdmin's one-arg version.
    def has_add_permission(self, request: HttpRequest, obj: Organization | None) -> bool:  # type: ignore[override]
        return False

    def get_queryset(self, request: HttpRequest) -> QuerySet[OrganizationUser]:
        return super().get_queryset(request).select_related("user").prefetch_related("user__groups__permissiongroup")

    # Django renders a blank row for this formset — its ``empty_form``, and any
    # extra the management form declares when the page re-renders after a
    # validation error. That row's instance is unsaved, so every display below has
    # to tolerate a missing user rather than reverse a URL with ``None`` in it.

    @admin.display(description="Member")
    def member(self, obj: OrganizationUser) -> str:
        if obj.user_id is None:
            return ""
        url = reverse("admin:accounts_user_change", args=[obj.user_id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email or obj.user)

    @admin.display(description="Roles")
    def roles(self, obj: OrganizationUser) -> str:
        """Read off the prefetch rather than via ``accounts.selectors.member_role_names``.

        The change forms use that selector, but they read one object; this renders a
        row per member, so a per-row query would be an N+1 — production has an
        organization with 90 members.
        """
        if obj.user_id is None:
            return ""
        names = []
        for group in obj.user.groups.all():
            if not hasattr(group, "permissiongroup"):
                continue
            permission_group = group.permissiongroup
            if permission_group.organization_id == obj.organization_id:
                names.append(permission_group.name)
        return ", ".join(sorted(names)) or "—"

    @admin.display(description="Owner", boolean=True)
    def owner(self, obj: OrganizationUser) -> bool:
        return hasattr(obj, "organizationowner")

    @admin.display(description="")
    def change_roles(self, obj: OrganizationUser) -> str:
        if obj.user_id is None:
            return ""
        return _change_roles_link(obj)


class OrganizationProfileInline(admin.StackedInline):
    model = OrganizationProfile
    form = OrganizationProfileForm
    can_delete = False
    min_num = 1
    max_num = 1
    verbose_name_plural = "Profile"


class MemberInviteAdminMixin:
    """Shared invite handling for the two admin pages that offer it.

    The organization's page fixes the organization; the Organization users page
    asks for it.  Everything after the form validates is identical.
    """

    # What the mixin needs from the ModelAdmin it is mixed into.
    admin_site: admin.AdminSite
    model: type[Model]
    message_user: Callable[..., None]

    INVITE_HELP_TEXT = (
        "The person is invited by email and given the roles you select. If they already have an "
        "account it is reused, and reactivated if it was disabled."
    )

    def _invite_member(
        self,
        request: HttpRequest,
        organization: Organization,
        form: OrganizationMemberInviteForm,
    ) -> HttpResponseRedirect:
        email = form.cleaned_data["email"]
        role_templates = form.selected_templates()

        try:
            member_invite(
                organization=organization,
                email=email,
                permission_templates=role_templates,
                invited_by=cast(User, request.user),
                site=Site.objects.get(pk=settings.SITE_ID),
            )
        except ValidationError as error:
            self.message_user(request, "; ".join(error.messages), messages.ERROR)
            return redirect(request.get_full_path())

        self.message_user(request, _invited_message(email, organization, role_templates), messages.SUCCESS)
        # Back to the organization, where the Members inline lists them.
        return redirect(reverse("admin:organizations_organization_change", args=[organization.pk]))

    def _invite_context(
        self,
        request: HttpRequest,
        form: OrganizationMemberInviteForm,
        *,
        title: str,
        cancel_url: str,
        organization: Organization | None = None,
    ) -> dict[str, Any]:
        return {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "organization": organization,
            "form": form,
            "title": title,
            "help_text": self.INVITE_HELP_TEXT,
            "submit_label": "Send invitation",
            "cancel_url": cancel_url,
        }


@admin.register(Organization)
class CustomOrganizationAdmin(MemberInviteAdminMixin, admin.ModelAdmin):
    inlines = [OrganizationProfileInline, OrganizationMemberInline, PermissionGroupInline]
    list_display = ("name",)
    search_fields = ("name",)
    fields = ("name", "is_active", "slug")
    readonly_fields = ("slug",)
    change_form_template = "admin/organizations/organization/change_form.html"
    # django-organizations' models define get_absolute_url against its own generic
    # views, which accounts/urls.py deliberately does not route, so reversing it
    # raises NoReverseMatch. Offering "View on site" would error.
    view_on_site = False

    def save_related(self, request: HttpRequest, form: Any, formsets: Any, change: bool) -> None:
        """Reconcile permission groups once the profile's org types are saved."""
        super().save_related(request, form, formsets, change)
        reconcile_org_groups(form.instance)

    def get_urls(self) -> list[URLPattern]:
        custom_urls = [
            path(
                "<path:object_id>/add-member/",
                self.admin_site.admin_view(self.add_member_view),
                name="organizations_organization_add_member",
            ),
            path(
                "<path:object_id>/change-roles/<int:user_id>/",
                self.admin_site.admin_view(self.change_member_roles_view),
                name="organizations_organization_change_member_roles",
            ),
        ]
        return custom_urls + super().get_urls()

    def add_member_view(self, request: HttpRequest, object_id: str) -> HttpResponse:
        """Invite a person into this organization with one or more roles."""
        organization = get_object_or_404(Organization, pk=object_id)

        if not REGISTRY.invitable_template_names_for(organization):
            self.message_user(
                request,
                f"Set an org type on {organization.name} before adding members — "
                "it determines which roles its members can hold.",
                messages.ERROR,
            )
            return redirect(reverse("admin:organizations_organization_change", args=[organization.pk]))

        if request.method == "POST":
            form = OrganizationMemberInviteForm(request.POST, organization=organization)
            if form.is_valid():
                return self._invite_member(request, organization, form)
        else:
            form = OrganizationMemberInviteForm(organization=organization)

        context = self._invite_context(
            request,
            form,
            title=f"Add member to {organization.name}",
            cancel_url=reverse("admin:organizations_organization_change", args=[organization.pk]),
            organization=organization,
        )
        return TemplateResponse(request, "admin/organizations/organization/member_form.html", context)

    def change_member_roles_view(self, request: HttpRequest, object_id: str, user_id: int) -> HttpResponse:
        """Set exactly which roles an existing member holds.

        Unchecking a role revokes it — the admin had no way to do this, leaving
        the raw ``auth.Group`` picker on the user page as the only route.
        """
        organization = get_object_or_404(Organization, pk=object_id)
        member = get_object_or_404(User, pk=user_id)
        organization_url = reverse("admin:organizations_organization_change", args=[organization.pk])

        if request.method == "POST":
            form = OrganizationMemberRoleForm(request.POST, organization=organization, member=member)
            if form.is_valid():
                role_templates = form.selected_templates()
                try:
                    member_roles_replace(
                        organization=organization,
                        user_id=member.pk,
                        permission_templates=role_templates,
                    )
                except ValidationError as error:
                    self.message_user(request, "; ".join(error.messages), messages.ERROR)
                    return redirect(request.get_full_path())

                roles = (
                    ", ".join([*(template.name for template in role_templates), *form.locked_role_names]) or "no roles"
                )
                self.message_user(
                    request,
                    f"{member.email or member} now holds {roles} in {organization.name}.",
                    messages.SUCCESS,
                )
                return redirect(organization_url)
        else:
            form = OrganizationMemberRoleForm(organization=organization, member=member)

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "organization": organization,
            "form": form,
            "title": f"Roles for {member.email or member} in {organization.name}",
            "help_text": "Unchecking a role revokes it. Clearing them all leaves the person a member with no access.",
            "submit_label": "Save roles",
            "cancel_url": organization_url,
        }
        return TemplateResponse(request, "admin/organizations/organization/member_form.html", context)


@admin.register(OrganizationUser)
class CustomOrganizationUserAdmin(MemberInviteAdminMixin, ModelAdmin[OrganizationUser]):
    list_display = ("user", "organization", "change_roles")
    list_filter = ("organization",)
    search_fields = ("user__email", "organization__name")
    # django-organizations' models define get_absolute_url against its own generic
    # views, which accounts/urls.py deliberately does not route, so reversing it
    # raises NoReverseMatch. Offering "View on site" would error.
    view_on_site = False

    # Excludes django-organizations' own ``is_admin``: nothing in this codebase
    # reads it, so it renders as a checkbox that looks like it grants admin and
    # does not.  Org Admin is a permission group, shown read-only below.
    fields = ("organization", "user", "roles")
    readonly_fields = ("roles",)

    @admin.display(description="")
    def change_roles(self, obj: OrganizationUser) -> str:
        """Changelist column linking to the organization admin's role editor.

        Editing roles on this form would mean a second implementation of the role
        editor, against a form that does not know which organization's roles it is
        offering until it reads the row.
        """
        return _change_roles_link(obj)

    @admin.display(description="Roles in this organization")
    def roles(self, obj: OrganizationUser) -> str:
        """The roles held, with the editor link on the same row.

        One field rather than two, so the link sits beside what it edits instead
        of on its own labelless row beneath it.
        """
        names = member_role_names(user_id=obj.user_id, organization_id=obj.organization_id)
        return format_html("{} {}", ", ".join(names) or "—", _change_roles_link(obj))

    def add_view(
        self, request: HttpRequest, form_url: str = "", extra_context: dict[str, Any] | None = None
    ) -> HttpResponse:
        """Invite a member, choosing the organization as well as the role.

        The default ModelForm would add an ``OrganizationUser`` row with no role
        at all, which is the state that made an organization unusable.
        """
        if request.method == "POST":
            form = OrganizationMemberInviteForm(request.POST)
            if form.is_valid():
                return self._invite_member(request, form.cleaned_data["organization"], form)
        else:
            form = OrganizationMemberInviteForm()

        context = self._invite_context(
            request,
            form,
            title="Add member",
            cancel_url=reverse("admin:organizations_organizationuser_changelist"),
        )
        return TemplateResponse(request, "admin/organizations/organization/member_form.html", context)

    def has_delete_permission(self, request: HttpRequest, obj: OrganizationUser | None = None) -> bool:
        """Withhold deletion for the rows ``organization_remove_member`` refuses.

        That service rejects removing the organization's owner and removing
        yourself.  Deletion is routed through it, so a row it would refuse has to
        be unavailable here or the admin turns its ``ValidationError`` into a 500.

        This is also what protects the owner at all on the bulk path:
        ``AbstractOrganizationUser.delete`` raises ``OwnershipRequired``, but only
        from ``Model.delete()``, so the changelist's ``queryset.delete()`` was
        previously unguarded.  ``get_deleted_objects`` consults this per selected
        row and ``delete_selected`` refuses the whole batch if any row is
        protected.
        """
        if obj is not None:
            if obj.user_id == request.user.pk:
                return False
            if OrganizationOwner.objects.filter(organization_user=obj).exists():
                return False
        return super().has_delete_permission(request, obj)

    def delete_model(self, request: HttpRequest, obj: OrganizationUser) -> None:
        """Remove the membership through the service, so roles are revoked with it.

        Deleting the row on its own leaves the user holding every
        ``org:<pk>:<role>`` group for an organization they no longer belong to.
        ``organization_remove_member`` clears them first; commit cd10a5aa
        centralized that rule in the service layer, so the admin calls it rather
        than reinstating a ``post_delete`` receiver.
        """
        organization_remove_member(
            organization=obj.organization,
            user_id=obj.user_id,
            removed_by=cast(User, request.user),
        )

    def delete_queryset(self, request: HttpRequest, queryset: QuerySet[OrganizationUser]) -> None:
        """Route the changelist's bulk delete through the same service.

        The action deletes through a queryset, which would skip
        :meth:`delete_model` entirely.
        """
        for membership in queryset.select_related("organization"):
            self.delete_model(request, membership)

    def get_readonly_fields(self, request: HttpRequest, obj: OrganizationUser | None = None) -> tuple[str, ...]:
        """Fix the membership's own foreign keys once the row exists.

        Repointing either moves the membership while its org-scoped groups stay
        on the old pair, leaving a user holding every ``org:<pk>:<role>`` group
        for an organization they are no longer in.  The form this admin replaced
        excluded ``user`` for the same reason; the default ModelForm this branch
        fell back to offered both.
        """
        if obj is None:
            return tuple(self.readonly_fields)
        return ("organization", "user", *self.readonly_fields)


@admin.register(ExtendedOrganizationInvitation)
class ExtendedOrganizationInvitationAdmin(ModelAdmin[ExtendedOrganizationInvitation]):
    list_display = ("invited_by", "invitee", "organization", "accepted")
    search_fields = ("invited_by__username", "invitee__username", "organization__name")
    list_filter = ("organization", "accepted")
    # get_absolute_url reverses invitations_register, which is routed but whose view
    # raises Http404 — this project accepts invitations immediately instead of via an
    # activation step. The link resolves and then always 404s.
    view_on_site = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (("Personal info"), {"fields": ("first_name", "last_name", "middle_name")}),
        (
            ("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (("Important dates"), {"fields": ("last_login",)}),
        (("Organizations"), {"fields": ("organizations_and_roles",)}),
    )
    # Not convinced this is the right type; we cast our custom User as a DefaultUser.
    model = cast(Type[DefaultUser], User)
    list_display = ["id", "full_name", "email"]
    list_filter = ["organizations_organization", "is_active", "is_staff", "is_superuser"]
    readonly_fields = ("organizations_and_roles",)

    @admin.display(description="Organizations and roles")
    def organizations_and_roles(self, obj: User) -> str:
        """Answer "what can this person do, and where" from the user page.

        Read-only: roles are granted per organization, so they are changed from
        the organization's Add member page or its permission groups.
        """
        by_organization = role_names_by_organization(user_id=obj.pk)
        if not by_organization:
            return "—"
        return format_html_join(
            "", "<div>{}: {}</div>", ((name, ", ".join(roles)) for name, roles in by_organization.items())
        )
