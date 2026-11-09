"""Meta-test — row-invariant gates must be declared or registered (ADR 0004).

``perm_checker=can_anywhere_checker`` answers "does the user hold this
permission anywhere?" without looking at a row — it is *row-invariant*.  That is
correct only where the rows are deliberately row-invariant:

* on a **platform-shared** model the model's own declaration is the proof, and
* on an **org-anchored** model it is a deliberate exception (SHARED reads,
  reference-data lookups) and so must be listed in ``ROW_INVARIANT_REVIEW`` with
  a rationale.

The collector resolves the ``perm_checker`` expression through the module
namespace and compares **identity**, so an aliased or module-qualified spelling
is collected exactly like the plain one — a name compare would miss it while a
raw-text scan still reported the module as covered (finding F5).  Anything that
looks like a transport but cannot be resolved is recorded and fails the suite
rather than being dropped.
"""

from __future__ import annotations

import ast
from importlib import import_module
from pathlib import Path
from typing import Any

import pytest

from common.graphql.permission_checkers import can_anywhere_checker
from common.models import AccessClass, OrgScoped

#: Modules known to gate with the row-invariant checker.  The coverage test
#: recomputes this by scanning every ``schema.py``/``types.py`` under ``apps``,
#: so a new one fails here until it is added — no silent additions.
ROW_INVARIANT_MODULES = {
    "clients.schema",
    "notes.schema",
    "tasks.schema",
}

#: Modules whose gates are all on platform-shared models, where the model
#: declaration is the proof and no per-site entry is needed.  The justification
#: is pinned by ``test_platform_shared_exemptions_are_justified``.
PLATFORM_SHARED_MODULES = {
    "clients.schema": (
        "the client family is platform-shared (org_via=None) and declares "
        "access.write=AccessClass.SHARED, so any holder of the permission may act on "
        "any row — the gate and the declaration agree (RFC 0002)"
    ),
}

#: (module, site) → why a row-invariant gate on *org-anchored* rows is safe.
#: Only the deliberate exceptions belong here; everything else is derived.
ROW_INVARIANT_REVIEW = {
    ("notes.schema", "Query.note"): (
        "SHARED read on notes (RFC 0003 slice 2): cross-org note reads are a product decision"
    ),
    ("notes.schema", "Query.notes"): (
        "SHARED read on notes (RFC 0003 slice 2): the list is agency-wide by product decision"
    ),
    ("notes.schema", "Query.services"): (
        "reference-data read gated by note ADD; the rows are global service data, not org authority"
    ),
    ("notes.schema", "Query.service_categories"): (
        "reference-data read gated by note ADD; the rows are global service data, not org authority"
    ),
    ("notes.schema", "Query.interaction_authors"): (
        "reference-data read gated by note ADD; the rows are global reference data, not org authority"
    ),
    ("tasks.schema", "Query.task"): (
        "SHARED read on tasks (RFC 0003 slice 1): cross-org task reads are a product decision"
    ),
    ("tasks.schema", "Query.task_assignees"): (
        "the assignee picker lists the caller's org members; gated on tasks.add/change "
        "rather than the roster permission, and the org filter is its own GetQueryset"
    ),
    ("tasks.schema", "Query.tasks"): (
        "SHARED read on tasks (RFC 0003 slice 1): the list is agency-wide by product decision"
    ),
}


class _GateCollector(ast.NodeVisitor):
    """Collect ``perm_checker`` call sites with their ``Class.member`` path."""

    def __init__(self, namespace: dict[str, Any]) -> None:
        self.ns = namespace
        self._path: list[str] = []
        self.sites: list[str] = []
        self.unresolved: list[str] = []

    # -- path tracking ---------------------------------------------------
    def _visit_named(self, node: ast.AST, name: str) -> None:
        self._path.append(name)
        self.generic_visit(node)
        self._path.pop()

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        self._visit_named(node, node.name)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._visit_named(node, node.name)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._visit_named(node, node.name)

    def visit_Assign(self, node: ast.Assign) -> None:
        # Declarative fields are class-level assignments: `tasks = offset_paginated(...)`.
        if self._path and isinstance(node.targets[0], ast.Name):
            self._visit_named(node, node.targets[0].id)
        else:
            self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        if self._path and isinstance(node.target, ast.Name):
            self._visit_named(node, node.target.id)
        else:
            self.generic_visit(node)

    # -- collection ------------------------------------------------------
    def visit_Call(self, node: ast.Call) -> None:
        site = ".".join(self._path) or "<module>"
        for keyword in node.keywords:
            if keyword.arg != "perm_checker":
                continue
            try:
                resolved = eval(  # noqa: S307 — module namespace, trusted test source
                    compile(ast.Expression(keyword.value), "<gate>", "eval"),
                    self.ns,
                )
            except Exception:
                self.unresolved.append(site)
                continue
            if not callable(resolved):
                # A literal or otherwise non-callable ``perm_checker`` names no
                # transport — loud, not silently skipped.
                self.unresolved.append(site)
                continue
            if resolved is can_anywhere_checker:
                self.sites.append(site)
        self.generic_visit(node)


def _collect(module_name: str) -> tuple[list[str], list[str]]:
    module = import_module(module_name)
    module_file = module.__file__
    assert module_file is not None, f"{module_name} has no source file"
    tree = ast.parse(Path(module_file).read_text())
    collector = _GateCollector(dict(vars(module)))
    collector.visit(tree)
    return collector.sites, collector.unresolved


def _modules_using_the_transport() -> set[str]:
    """Every module under ``apps`` that gates with the checker, by identity.

    Every ``.py`` in every app, not just ``schema.py``/``types.py``: a gate in a
    service or a view would otherwise be invisible to the registry while the
    docstring here claimed full coverage.  The name is used as a cheap file
    filter only — whether a module *has* a gate is still decided by parsing it
    and resolving the call by identity.
    """
    found: set[str] = set()
    apps_root = Path(__file__).resolve().parents[2]
    for source_path in apps_root.glob("*/**/*.py"):
        if not (source_path.parent / "__init__.py").exists():
            continue
        if "can_anywhere_checker" not in source_path.read_text():
            continue
        module_name = ".".join(source_path.relative_to(apps_root).with_suffix("").parts)
        try:
            sites, _ = _collect(module_name)
        except Exception:  # pragma: no cover - a module that cannot import is not our concern
            continue
        if sites:
            found.add(module_name)
    return found


def test_every_module_using_the_transport_is_scanned() -> None:
    """A new module gating with the checker must be registered, not silent."""
    assert _modules_using_the_transport() == ROW_INVARIANT_MODULES


def test_platform_shared_exemptions_are_justified() -> None:
    """An exempt module's models really are platform-shared with SHARED writes."""
    for module_name in PLATFORM_SHARED_MODULES:
        assert module_name in ROW_INVARIANT_MODULES

    from clients import models as client_models

    for name in (
        "ClientProfile",
        "ClientContact",
        "ClientHouseholdMember",
        "HmisProfile",
        "SocialMediaProfile",
    ):
        model = getattr(client_models, name)
        assert issubclass(model, OrgScoped)
        assert model.org_via is None, f"{name} is no longer platform-shared — exempt it per site"
        assert model.access.write == AccessClass.SHARED, f"{name} is no longer SHARED-write — exempt it per site"


@pytest.mark.parametrize("module_name", sorted(ROW_INVARIANT_MODULES - PLATFORM_SHARED_MODULES.keys()))
def test_every_gate_in_an_org_anchored_module_is_registered(module_name: str) -> None:
    """Org-anchored gates are elections: each one names its reason."""
    sites, unresolved = _collect(module_name)

    assert not unresolved, f"{module_name}: perm_checker could not be resolved at {unresolved}"
    missing = [site for site in sites if (module_name, site) not in ROW_INVARIANT_REVIEW]
    assert not missing, (
        f"{module_name}: row-invariant gate(s) without a registry entry: {missing}. "
        "Add (module, site) -> reason to ROW_INVARIANT_REVIEW, or stop using the checker there."
    )


@pytest.mark.parametrize("module_name", sorted(ROW_INVARIANT_MODULES - PLATFORM_SHARED_MODULES.keys()))
def test_registry_entries_name_real_sites(module_name: str) -> None:
    """A stale entry is a reason that reads as coverage while providing none."""
    sites, _ = _collect(module_name)
    stale = [entry for entry in ROW_INVARIANT_REVIEW if entry[0] == module_name and entry[1] not in sites]
    assert not stale, f"{module_name}: registry entries for sites that no longer use the checker: {stale}"


def test_aliased_and_qualified_checkers_are_collected() -> None:
    """F5: name matching missed these; identity resolution must not."""
    source = """
from common.graphql import permission_checkers
from common.graphql.permission_checkers import can_anywhere_checker as checker


class Query:
    aliased = f(perm_checker=checker)
    qualified = f(perm_checker=permission_checkers.can_anywhere_checker)
    plain = f(perm_checker=can_anywhere_checker)
    other = f(perm_checker=some_other_checker)
    untyped = f(perm_checker="not resolved here")
"""
    namespace: dict[str, Any] = {
        "can_anywhere_checker": can_anywhere_checker,
        "permission_checkers": import_module("common.graphql.permission_checkers"),
        "checker": can_anywhere_checker,
        "some_other_checker": lambda *args, **kwargs: None,
        "f": lambda **kwargs: None,
    }
    collector = _GateCollector(namespace)
    collector.visit(ast.parse(source))

    assert collector.sites == ["Query.aliased", "Query.qualified", "Query.plain"]
    assert collector.unresolved == ["Query.untyped"]
