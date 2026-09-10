"""``manage.py explain_permission`` — why a user can or cannot do P at org O / on object R.

Usage::

    python manage.py explain_permission --user jane@example.org --perm shelters.change_shelter --org 7
    python manage.py explain_permission --user 42 --perm shelters.view_shelter --object shelters.shelter:12

Prints the verdict from the canonical predicate (``can`` / ``can_obj`` /
``can_anywhere`` — never a second implementation of the rules) and the arms
behind it: global tier, direct grant, delegated grant, object grant (not wired
yet), and the legacy ``PermissionGroup`` arm with its live/inert domain posture.

Exits 0 when allowed, 1 when denied — script-friendly.  See
``common.permissions.explain`` and ``docs/adr/0001-grant-based-authorization.md``.
"""

from __future__ import annotations

import sys
from typing import TYPE_CHECKING, Any, Optional, cast

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from organizations.models import Organization

from common.permissions.explain import explain

if TYPE_CHECKING:
    from django.db.models import Model

    from accounts.models import User


class Command(BaseCommand):
    help = "Explain a user's grant-model authority (can/can't they do P at org O / on object R)"

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--user", required=True, help="User pk, username, or email.")
        parser.add_argument("--perm", required=True, help="Permission as 'app_label.codename'.")
        parser.add_argument("--org", help="Organization pk or slug.")
        parser.add_argument(
            "--object",
            dest="object_ref",
            help="Object as 'app_label.model:pk' — e.g. shelters.shelter:12.",
        )

    def handle(self, **options: Any) -> None:
        user = self._resolve_user(options["user"])
        org = self._resolve_org(options.get("org"))
        obj = self._resolve_object(options.get("object_ref"))
        if org is not None and obj is not None:
            raise CommandError("pass at most one of --org / --object.")

        try:
            explanation = explain(user, options["perm"], org=org, obj=obj)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        posture = (
            "grant-only domain — legacy rows inert" if explanation.cut_over else "legacy domain — NOT cut over yet"
        )
        display_name = user.full_name or user.username
        self.stdout.write(f"user        {display_name} <{user.email or '—'}> (pk={user.pk})")
        self.stdout.write(f"permission  {explanation.perm}  [{posture}]")
        if explanation.org is not None:
            self.stdout.write(f'org         {explanation.org.pk} "{explanation.org.name}"')
        if explanation.obj is not None:
            self.stdout.write(f"object      {explanation.obj._meta.label_lower} #{explanation.obj.pk}")
        self.stdout.write(
            f"verdict     {'ALLOWED' if explanation.verdict else 'DENIED'}  ({explanation.mode} predicate)"
        )
        self.stdout.write("arms")
        for arm in explanation.arms:
            self.stdout.write(f"  {arm.label:<13} {'YES' if arm.holds else 'no':<4} {arm.detail}")
        if explanation.notes:
            self.stdout.write("notes")
            for note in explanation.notes:
                self.stdout.write(f"  - {note}")
        if not explanation.verdict:
            sys.exit(1)

    @staticmethod
    def _resolve_user(ref: str) -> "User":
        from accounts.models import User

        user: User
        if ref.isdigit():
            try:
                user = User.objects.get(pk=int(ref))
            except User.DoesNotExist:
                raise CommandError(f"no user with pk {ref}.") from None
        else:
            matches = list(User.objects.filter(Q(username=ref) | Q(email__iexact=ref))[:2])
            if not matches:
                raise CommandError(f"no user matches {ref!r} (pk, username, or email).")
            if len(matches) > 1:
                raise CommandError(f"{ref!r} matches more than one user — use the pk.")
            user = matches[0]
        return user

    @staticmethod
    def _resolve_org(ref: Optional[str]) -> Optional["Organization"]:
        if not ref:
            return None
        query = Q(pk=int(ref)) if ref.isdigit() else Q(slug=ref)
        try:
            return Organization.objects.get(query)
        except Organization.DoesNotExist:
            raise CommandError(f"no organization matches {ref!r} (pk or slug).") from None

    @staticmethod
    def _resolve_object(ref: Optional[str]) -> Optional["Model"]:
        if not ref:
            return None
        expected = "--object must be 'app_label.model:pk' — e.g. shelters.shelter:12."
        if ":" not in ref:
            raise CommandError(expected)
        label, _, pk = ref.rpartition(":")
        app_label, _, model_name = label.partition(".")
        if not app_label or not model_name or not pk.isdigit():
            raise CommandError(expected)
        try:
            model = apps.get_model(app_label, model_name)
        except LookupError:
            raise CommandError(f"no installed model named {label!r}.") from None
        obj = model._base_manager.filter(pk=int(pk)).first()
        if obj is None:
            raise CommandError(f"no {label} with pk {pk}.")
        return cast("Model", obj)
