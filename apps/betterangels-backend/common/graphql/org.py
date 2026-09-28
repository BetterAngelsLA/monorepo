"""Org-id resolution for resolvers that authorize at a payload/filter org.

ADR 0001 §5: cut-over mutations take the acting org explicitly (payload) and
queries carry it in a filter — never a request header.  This module is the
resolver-facing alias of :func:`common.permissions.gates.org_or_deny`; the
guard itself lives with the other refusals in ``common.permissions.gates`` so
every denial shares one home, one message, and one failure mode.
"""

from __future__ import annotations

from common.permissions.gates import org_or_deny
from organizations.models import Organization


def resolve_org_or_deny(org_id: object) -> Organization:
    """Resolve an org id, failing closed on a missing/unknown/malformed one.

    See :func:`~common.permissions.gates.org_or_deny` for the validation and
    refusal contract.  Kept as the resolver-facing name so schema modules keep
    importing from ``common.graphql.org``.  Module-level because
    strawberry-django mutation resolvers are invoked unbound.
    """
    return org_or_deny(org_id)
