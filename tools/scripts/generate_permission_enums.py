


All org-scoped permission enums that should appear in the frontend's
`hasPermission()` call sites must be listed in PERMISSION_ENUMS below.
"""

from __future__ import annotations

import os
import sys
from typing import List, Type
from django.db.models import TextChoices

# Add the backend to the path so we can import from it.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "apps", "betterangels-backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")

import django
django.setup()

from accounts.permissions import UserOrganizationPermissions
from reports.permissions import ReportPermissions
from shelters.permissions import ShelterPermissions
from teams.permissions import TeamPermissions

# ── Configuration ─────────────────────────────────────────────────────────────
# Add new permission enums here to include them in the generated output.
PERMISSION_ENUMS: List[Type[TextChoices]] = [
    UserOrganizationPermissions,
    ReportPermissions,
    ShelterPermissions,
    TeamPermissions,
]

# ── Generation ────────────────────────────────────────────────────────────────

HEADER = """\
/**
 * Auto-generated permission constants from backend Python enums.
 * DO NOT EDIT — regenerate with:
 *   tools/scripts/generate_permission_enums.py > libs/ba-permissions/src/index.ts
 *
 * Each const object maps enum member names to their Django permission values
 * ("app_label.codename"). These values match the strings returned by the
 * backend's dynamic permissions resolver and can be used directly with
 * `hasPermission()`.
 */

"""


def generate_enum_const(enum_cls: Type[TextChoices]) -> str:
    name = enum_cls.__name__
    members = []
    for perm in enum_cls:
        members.append(f'  {perm.name}: "{perm.value}",')
    return f"export const {name} = {{\n" + "\n".join(members) + "\n} as const;"


def generate_permission_union(enums: List[Type[TextChoices]]) -> str:
    types = [f"  | typeof {e.__name__}[keyof typeof {e.__name__}]" for e in enums]
    return "export type PermissionEnum =\n" + "\n".join(types) + ";"


def main() -> None:
    out = [HEADER]
    for enum_cls in PERMISSION_ENUMS:
        out.append(generate_enum_const(enum_cls))
        out.append("")
    out.append(generate_permission_union(PERMISSION_ENUMS))
    print("\n".join(out))


if __name__ == "__main__":
    main()
