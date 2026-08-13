"""Force-sync every organization's permission groups with current templates.

The same reconciliation runs automatically on ``post_migrate``; this command
exists for operational use — e.g. verifying that every org's groups carry the
current permission sets (``teams.*`` included) during the org-scoping rollout.

Usage::

    manage.py sync_org_permission_groups            # reconcile orgs + sync group perms
    manage.py sync_org_permission_groups --check    # report out-of-sync groups only
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Reconcile all organizations' permission groups with current templates."

    def add_arguments(self, parser):  # type: ignore[no-untyped-def]
        parser.add_argument(
            "--check",
            action="store_true",
            help="Report groups whose permissions differ from their template without writing.",
        )

    def handle(self, *args, **options):  # type: ignore[no-untyped-def]
        from accounts.models import PermissionGroup

        if options["check"]:
            mismatches = 0
            groups = PermissionGroup.objects.select_related("template", "organization").prefetch_related(
                "group__permissions", "template__permissions"
            )
            for pg in groups:
                if pg.template is None:
                    continue
                have = set(pg.group.permissions.values_list("pk", flat=True))
                want = set(pg.template.permissions.values_list("pk", flat=True))
                if have != want:
                    mismatches += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"MISMATCH org={pg.organization_id} '{pg.template.name}': "
                            f"missing {len(want - have)}, extra {len(have - want)} permissions"
                        )
                    )
            self.stdout.write(f"{mismatches} permission group(s) out of sync.")
            return

        from accounts.signals import sync_all_org_permission_groups

        sync_all_org_permission_groups(None)
        self.stdout.write(self.style.SUCCESS("Synced all organization permission groups."))
