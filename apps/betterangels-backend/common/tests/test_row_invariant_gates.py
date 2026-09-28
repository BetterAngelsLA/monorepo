"""Meta-test — row-invariant gates must be declared or registered (ADR 0004).

Two grant-model transports answer "holds the permission anywhere" without a
row — they are *row-invariant*:

* ``perm_checker=can_anywhere_checker`` on declarative fields (SHARED write
  class; SHARED reads on caseworker surfaces; reference-data reads gated by a
  create permission), and
* ``visible_rows_for_holder`` in a type-level ``get_queryset`` (list reads).

They are correct only where the rows are deliberately row-invariant.  For a
**platform-shared** model the model's own declaration is the proof — this test
resolves each gate's permission to its model and checks that a write gate
(ADD/CHANGE/DELETE) rides ``access.write = WRITE_SHARED``, while a read gate
(VIEW) is the platform-shared read rule.  For an **org-anchored** model the
gate is a deliberate exception (SHARED reads, reference-data lookups) and must
be registered in ``ROW_INVARIANT_REVIEW`` with its rationale, so additions are
auditable elections instead of silent over-permission.

A module that starts using either transport must join
``ROW_INVARIANT_MODULES`` — the coverage test below fails otherwise.
"""

from __future__ import annotations

import ast
from functools import lru_cache
from importlib import import_module
from pathlib import Path
from typing import Any, Optional

import pytest
from common.models import WRITE_SHARED
from django.apps import apps

CAN_ANYWHERE_CHECKER = "can_anywhere_checker"
LIST_HOOK = "visible_rows_for_holder"

#: Modules scanned for row-invariant gates.  The coverage test below fails when
#: any other module starts using one of the transports.
ROW_INVARIANT_MODULES = (
    "clients.schema",
    "clients.types",
    "notes.schema",
    "notes.types",
    "tasks.schema",
    "tasks.types",
)

#: (module, site) → why a gate on *org-anchored* rows is safe.  Platform-shared
#: sites are validated against the model's ``access`` declaration and need no
#: entry; these are the deliberate exceptions (RFC 0002/0003).
ROW_INVARIANT_REVIEW = {
    ("notes.schema", "Query.note"): ("SHARED read on notes (RFC 0003): cross-org note reads are a product decision"),
    ("notes.schema", "Query.services"): (
        "reference-data read gated by note ADD; the rows are global service data, not org-scoped authority"
    ),
    ("notes.schema", "Query.service_categories"): (
        "reference-data read gated by note ADD; the rows are global service data, not org-scoped authority"
    ),
    ("notes.schema", "Query.interaction_authors"): (
        "reference-data read gated by note ADD; the rows are global reference data, not org-scoped authority"
    ),
    ("tasks.schema", "Query.task"): ("SHARED read on tasks (RFC 0003): cross-org task reads are a product decision"),
    ("notes.types", "_visible_note_rows"): "SHARED read list hook for notes (RFC 0003)",
    ("tasks.types", "_visible_task_rows"): "SHARED read list hook for tasks (RFC 0003)",
}


class _GateCollector(ast.NodeVisitor):
    """Collect gate call sites with their enclosing ``Class.member`` path."""

    def __init__(self) -> None:
        self.stack: list[str] = []
        self.sites: list[tuple[str, str, Optional[ast.expr]]] = []

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        self.stack.append(node.name)
        self.generic_visit(node)
        self.stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._visit_function(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._visit_function(node)

    def _visit_function(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> None:
        self.stack.append(node.name)
        self.generic_visit(node)
        self.stack.pop()

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        if isinstance(node.target, ast.Name):
            self.stack.append(node.target.id)
            self.generic_visit(node)
            self.stack.pop()
        else:
            self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        name = _call_name(node)
        if name in {"HasPerm", "HasRetvalPerm"}:
            keywords = {kw.arg: kw.value for kw in node.keywords}
            checker = keywords.get("perm_checker")
            if isinstance(checker, ast.Name) and checker.id == CAN_ANYWHERE_CHECKER:
                perms = keywords.get("perms")
                if perms is None and node.args:
                    perms = node.args[0]
                self.sites.append(("checker", ".".join(self.stack), perms))
        elif name == LIST_HOOK:
            keywords = {kw.arg: kw.value for kw in node.keywords}
            self.sites.append(("list_hook", ".".join(self.stack), keywords.get("perm")))
        self.generic_visit(node)


def _call_name(node: ast.Call) -> Optional[str]:
    func = node.func
    if isinstance(func, ast.Name):
        return func.id
    if isinstance(func, ast.Attribute):
        return func.attr
    return None


def _as_string(value: Any) -> Optional[str]:
    """The permission string behind a model attr or a TextChoices member."""
    if isinstance(value, str):
        inner = getattr(value, "value", value)
        return inner if isinstance(inner, str) else None
    return None


def _resolve_value(node: Optional[ast.expr], ns: dict[str, Any]) -> Any:
    if node is None:
        return None
    if isinstance(node, ast.Name):
        return ns.get(node.id)
    if isinstance(node, ast.Attribute):
        base = _resolve_value(node.value, ns)
        return getattr(base, node.attr, None) if base is not None else None
    if isinstance(node, (ast.List, ast.Tuple)):
        resolved = [_resolve_value(element, ns) for element in node.elts]
        return resolved if all(item is not None for item in resolved) else None
    return None


def _resolve(node: Optional[ast.expr], ns: dict[str, Any]) -> Optional[list[str]]:
    value = _resolve_value(node, ns)
    if value is None:
        return None
    items = value if isinstance(value, (list, tuple)) else [value]
    strings = [_as_string(item) for item in items]
    if not strings or any(item is None for item in strings):
        return None
    return [item for item in strings if item is not None]


@lru_cache(maxsize=None)
def _perm_details(perm: str) -> Optional[tuple[Any, str]]:
    """``(model, permission-set attribute)`` for a permission string, if modeled."""
    for model in apps.get_models():
        perms = getattr(model, "perms", None)
        if not isinstance(perms, type):
            continue
        for attr_name, value in vars(perms).items():
            if isinstance(value, str) and value == perm:
                return model, attr_name
    return None


def _resolve_hook_wrapper(tree: ast.Module, site: str, ns: dict[str, Any]) -> Optional[list[str]]:
    """Resolve a wrapper's ``perm`` parameter from its callers (one level).

    ``_visible_note_rows(queryset, info, perm)`` calls
    ``visible_rows_for_holder(..., perm=perm)``; its callers in the same module
    pass a literal permission.  Returns the union of the resolved caller
    arguments, or ``None`` when any caller cannot be resolved.
    """
    func_name = site.rsplit(".", 1)[-1]
    func = next(
        (node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef) and node.name == func_name),
        None,
    )
    if func is None:
        return None
    params = [arg.arg for arg in func.args.args]
    if "perm" not in params:
        return None
    index = params.index("perm")

    resolved: list[str] = []
    found_call = False
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call) or _call_name(node) != func_name:
            continue
        expr: Optional[ast.expr] = node.args[index] if len(node.args) > index else None
        if expr is None:
            expr = next((kw.value for kw in node.keywords if kw.arg == "perm"), None)
        if expr is None:
            continue
        found_call = True
        perms = _resolve(expr, ns)
        if perms is None:
            return None
        resolved.extend(perms)
    return sorted(set(resolved)) if found_call else None


def _scan_module(module_name: str) -> list[tuple[str, str, Optional[list[str]]]]:
    module = import_module(module_name)
    module_file = module.__file__
    assert module_file is not None  # imported project modules always have a file
    source = Path(module_file).read_text()
    tree = ast.parse(source)
    ns = vars(module)

    collector = _GateCollector()
    collector.visit(tree)

    results: list[tuple[str, str, Optional[list[str]]]] = []
    for kind, site, expr in collector.sites:
        perms = _resolve(expr, ns)
        if perms is None and kind == "list_hook":
            perms = _resolve_hook_wrapper(tree, site, ns)
        results.append((kind, site, perms))
    return results


def _all_platform_shared(perms: list[str]) -> bool:
    for perm in perms:
        details = _perm_details(perm)
        if details is None:
            return False
        model, _action = details
        if model.org_via is not None:
            return False
    return True


@pytest.mark.parametrize("module_name", ROW_INVARIANT_MODULES)
def test_row_invariant_gates_are_declared_or_registered(module_name: str) -> None:
    violations: list[str] = []
    unregistered: list[str] = []
    for _kind, site, perms in _scan_module(module_name):
        key = (module_name, site)
        if perms and _all_platform_shared(perms):
            for perm in perms:
                details = _perm_details(perm)
                assert details is not None  # _all_platform_shared guaranteed it
                model, action = details
                if action != "VIEW" and model.access.write != WRITE_SHARED:
                    violations.append(
                        f"{module_name}.{site}: {perm} is gated row-invariantly but "
                        f"{model.__name__}.access.write != WRITE_SHARED"
                    )
            continue
        if key in ROW_INVARIANT_REVIEW:
            continue
        unregistered.append(f"{module_name}.{site} ({', '.join(perms) if perms else 'unresolved perms'})")

    assert not violations, (
        "row-invariant gate contradicts the model's declared write class (RFC 0002) — "
        "the checker would over-permit what writable()/can_obj() refuse:\n" + "\n".join(violations)
    )
    assert not unregistered, (
        "row-invariant gate on org-anchored (or unresolved) permissions is not registered.\n"
        "Register it in ROW_INVARIANT_REVIEW with the reason the rows are row-invariant, "
        "or make the model's declaration cover it (platform-shared + access.write):\n" + "\n".join(unregistered)
    )


def test_registry_entries_match_real_sites() -> None:
    scanned = {
        (module_name, site)
        for module_name in ROW_INVARIANT_MODULES
        for _kind, site, _perms in _scan_module(module_name)
    }
    stale = sorted(key for key in ROW_INVARIANT_REVIEW if key not in scanned)
    assert not stale, f"stale ROW_INVARIANT_REVIEW entries: {stale}"


def test_every_module_using_a_row_invariant_transport_is_scanned() -> None:
    allowed = set(ROW_INVARIANT_MODULES) | {"common.graphql.permission_checkers"}
    found: set[str] = set()
    for app_config in apps.get_app_configs():
        root = Path(app_config.path)
        for path in root.rglob("*.py"):
            if any(part in {"tests", "__pycache__", "migrations"} for part in path.parts):
                continue
            text = path.read_text()
            if CAN_ANYWHERE_CHECKER not in text and LIST_HOOK not in text:
                continue
            module = ".".join((app_config.label, *path.relative_to(root).with_suffix("").parts))
            found.add(module.removesuffix(".__init__"))
    unexpected = sorted(found - allowed)
    assert not unexpected, (
        "module(s) use can_anywhere_checker/visible_rows_for_holder but are not scanned — "
        "add them to ROW_INVARIANT_MODULES and register their org-anchored sites: " + ", ".join(unexpected)
    )
