#!/usr/bin/env python
"""Write or check the manifest for the cached test database.

The manifest is intentionally stricter than the migration-name check:
it records the content hash of every applied migration and of every
non-migration input that can affect test database contents.  If an
already-applied migration is edited, the old dump is not safe to reuse.
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
REPO_ROOT = APP_ROOT.parent.parent
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")

import django  # noqa: E402

django.setup()

from django.db import connection  # noqa: E402
from django.db.migrations.loader import MigrationLoader  # noqa: E402
from django.db.migrations.recorder import MigrationRecorder  # noqa: E402

MANIFEST_VERSION = 1

APP_INPUTS = [
    "**/signals.py",
    "**/apps.py",
    "**/models.py",
    "betterangels_backend/settings*.py",
    "pyproject.toml",
    "scripts/prepare_test_db_cache.sh",
    "scripts/setup_test_db.py",
    "scripts/validate_test_db.py",
    "scripts/test_db_common.sh",
]
# post_migrate handlers seed the dump with code from the installed dependency
# set, so a lockfile change can still change its contents.
REPO_INPUTS = [
    "uv.lock",
]


def compose_db_config() -> bytes:
    """Return only the Compose ``db`` service block.

    The whole Compose file changes for app mounts and CI-only services, which
    must not invalidate the test database. The db service (image, command,
    environment) does affect it, so hash that block instead of the file.
    """
    lines = (REPO_ROOT / "docker-compose.yml").read_text().splitlines()
    block: list[str] = []
    in_db = False
    for line in lines:
        if line.startswith("  db:") and not line.startswith("    "):
            in_db = True
            continue
        if in_db:
            if line.startswith("  ") and not line.startswith("    ") and line.strip():
                break
            block.append(line)
    if not block:
        raise ValueError("docker-compose.yml has no db service")
    return "\n".join(block).encode()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def input_files() -> list[Path]:
    files: set[Path] = set()
    for pattern in APP_INPUTS:
        files.update(path for path in APP_ROOT.glob(pattern) if path.is_file())
    for name in REPO_INPUTS:
        path = REPO_ROOT / name
        if path.is_file():
            files.add(path)
    return sorted(files, key=lambda path: path.relative_to(REPO_ROOT).as_posix())


def input_hashes() -> dict[str, str]:
    hashes = {path.relative_to(REPO_ROOT).as_posix(): sha256_file(path) for path in input_files()}
    hashes["docker-compose.yml#db"] = hashlib.sha256(compose_db_config()).hexdigest()
    return hashes


def inputs_digest() -> str:
    digest = hashlib.sha256()
    for relative, file_hash in sorted(input_hashes().items()):
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(file_hash.encode())
        digest.update(b"\0")
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
                "inputs_sha256": inputs_digest(),
                "input_hashes": input_hashes(),
                "migrations": dict(sorted(migrations.items())),
            },
            indent=2,
        )
        + "\n"
    )


def check_manifest(manifest_path: Path) -> None:
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("version") != MANIFEST_VERSION:
        raise ValueError("manifest version changed")
    if manifest.get("inputs_sha256") != inputs_digest():
        current = input_hashes()
        previous = manifest.get("input_hashes", {})
        changed = sorted(name for name in set(current) | set(previous) if current.get(name) != previous.get(name))
        detail = f": {', '.join(changed)}" if changed else ""
        raise ValueError(f"DB-affecting inputs changed{detail}")

    loader = build_loader()
    manifest_migrations = set(manifest.get("migrations", {}))
    disk_migrations = {f"{app}.{name}" for app, name in loader.disk_migrations}
    new_migrations = sorted(disk_migrations - manifest_migrations)
    if new_migrations:
        raise ValueError(f"new migrations: {', '.join(new_migrations)}")

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


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    write_parser = subparsers.add_parser("write")
    write_parser.add_argument("--output", type=Path, required=True)
    check_parser = subparsers.add_parser("check")
    check_parser.add_argument("--manifest", type=Path, required=True)
    args = parser.parse_args()

    try:
        if args.command == "write":
            write_manifest(args.output)
        else:
            check_manifest(args.manifest)
    except (KeyError, ValueError, json.JSONDecodeError) as error:
        print(f"test DB cache manifest: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
