#!/usr/bin/env python
"""Write, check, or verify the manifest for the cached test database.

The manifest records the content hash of every applied migration. It is not a
source-code fingerprint: ``prepare_test_db_cache.sh`` always restores the dump,
runs ``migrate``, then flushes and re-runs the post-migrate seed handlers. The
manifest only protects against reusing a dump whose already-applied migrations
were edited, removed, or replaced.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import os
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")

import django  # noqa: E402

django.setup()

from django.db import connection  # noqa: E402
from django.db.migrations.loader import MigrationLoader  # noqa: E402
from django.db.migrations.recorder import MigrationRecorder  # noqa: E402

MANIFEST_VERSION = 4


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_loader() -> MigrationLoader:
    return MigrationLoader(connection, ignore_no_migrations=True)


def migration_hash(loader: MigrationLoader, key: tuple[str, str]) -> str:
    migration = loader.disk_migrations.get(key)
    if migration is None:
        raise KeyError(f"{key[0]}.{key[1]}")
    module = importlib.import_module(migration.__class__.__module__)
    module_file = module.__file__
    if module_file is None:
        raise KeyError(f"{key[0]}.{key[1]}")
    return sha256_file(Path(module_file))


def write_manifest(output: Path) -> None:
    loader = build_loader()
    applied = MigrationRecorder(connection).applied_migrations()
    migrations: dict[str, str] = {}
    for key in applied:
        app_label, name = key
        migrations[f"{app_label}.{name}"] = migration_hash(loader, key)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(
            {
                "version": MANIFEST_VERSION,
                "migrations": dict(sorted(migrations.items())),
            },
            indent=2,
        )
        + "\n"
    )


def check_manifest(manifest_path: Path) -> None:
    """Fail if an already-applied migration is no longer safe to reuse.

    New migrations are expected: the caller restores the dump and runs
    ``migrate`` to apply them.
    """
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("version") != MANIFEST_VERSION:
        raise ValueError("manifest version changed")

    loader = build_loader()
    replaced = set(loader.replacements)
    for qualified, expected in manifest.get("migrations", {}).items():
        app_label, name = qualified.split(".", 1)
        key = (app_label, name)
        if key in replaced:
            raise ValueError(f"{qualified} was replaced by a squashed migration")
        if key not in loader.disk_migrations:
            raise ValueError(f"{qualified} is no longer on disk")
        if migration_hash(loader, key) != expected:
            raise ValueError(f"{qualified} content changed")


def verify_database(manifest_path: Path) -> None:
    """Fail unless the connected database is exactly the manifest's dump.

    This catches a dump restored from a different cache entry (or a partially
    restored dump) before ``migrate`` applies anything on top of it.
    """
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("version") != MANIFEST_VERSION:
        raise ValueError("manifest version changed")

    expected = set(manifest.get("migrations", {}))
    applied = {f"{app_label}.{name}" for app_label, name in MigrationRecorder(connection).applied_migrations()}
    missing = sorted(expected - applied)
    extra = sorted(applied - expected)
    if missing or extra:
        raise ValueError(f"dump does not match manifest: {len(missing)} missing, {len(extra)} extra migrations")


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    write_parser = subparsers.add_parser("write")
    write_parser.add_argument("--output", type=Path, required=True)
    check_parser = subparsers.add_parser("check")
    check_parser.add_argument("--manifest", type=Path, required=True)
    verify_parser = subparsers.add_parser("verify")
    verify_parser.add_argument("--manifest", type=Path, required=True)
    args = parser.parse_args()

    try:
        if args.command == "write":
            write_manifest(args.output)
        elif args.command == "check":
            check_manifest(args.manifest)
        else:
            verify_database(args.manifest)
    except (KeyError, ValueError, json.JSONDecodeError) as error:
        print(f"test DB cache manifest: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
