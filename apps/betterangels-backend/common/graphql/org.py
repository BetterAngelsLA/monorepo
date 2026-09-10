"""Org-id resolution for resolvers that authorize at a payload/filter org.

ADR 0001 §5: cut-over mutations take the acting org explicitly (payload) and
queries carry it in a filter — never a request header.  This module is the one
resolver-side guard that turns that client input into an ``Organization``,
failing closed on anything it cannot resolve.
"""

from __future__ import annotations

import strawberry
from common.utils import get_or_none
from django.core.exceptions import PermissionDenied
from organizations.models import Organization


def resolve_org_or_deny(org_id: object) -> Organization:
    """Resolve an org id, failing closed on a missing/unknown/malformed one.

    *org_id* is client input (payload field or filter), so it is validated the
    way selectors validate pks: a missing one (``None``) and an id the column
    cannot hold (``""``, a UUID string) deny like an unknown one instead of
    reaching the DB as an unhandled ``ValueError``.  ``get_or_none`` is the
    house guard (``common.utils``) for the latter.  Module-level because
    strawberry-django mutation resolvers are invoked unbound.
    """
    if org_id is strawberry.UNSET:
        org_id = None
    org = get_or_none(Organization.objects.all(), org_id)
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org
