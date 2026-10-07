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
import textwrap
from functools import lru_cache
from importlib import import_module
from pathlib import Path
from typing import Any, Optional

import pytest
from common.graphql.permission_checkers import can_anywhere_checker, visible_rows_for_holder
from common.models import WRITE_SHARED
from django.apps import apps
from strawberry_django.permissions import HasPerm

#: The transports are recognised by **identity**, not by name.  A module is free
#: to alias or qualify them (``from ... import can_anywhere_checker as checker``,
#: ``permission_checkers.can_anywhere_checker``) — name matching would then miss
#: the gate while a raw-text coverage scan still reported the module as covered,
#: leaving the gate unregistered and unaudited.
CAN_ANYWHERE_CHECKER = "can_anywhere_checker"
LIST_HOOK = "visible_rows_for_holder"
CAN_ANYWHERE_CHECKER_OBJ = can_anywhere_checker
LIST_HOOK_OBJ = visible_rows_for_holder

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
    """Collect gate call sites with their enclosing ``Class.member`` path.

    Transports are recognised by resolving the callee to its object and comparing
    identity against the canonical transport, so aliased and module-qualified
    spellings are collected exactly like the plain ones.  A call that *looks* like
    a transport by name but cannot be resolved is recorded in ``unresolved``
    rather than dropped, so the coverage test can fail loudly instead of leaving
    an unaudited gate behind.
    """

    def __init__(self, ns: dict[str, Any]) -> None:
        self.ns = ns
        self.stack: list[str] = []
        self.sites: list[tuple[str, str, Optional[ast.expr]]] = []
        self.unresolved: list[str] = []

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

    def _enter(self) -> str:
        return ".".join(self.stack)

    def visit_Call(self, node: ast.Call) -> None:
        callee = _resolve_object(node.func, self.ns)
        name = _call_name(node)
        if callee is LIST_HOOK_OBJ:
            # Name the site after the wrapper when the hook is called from a
            # module-level helper (``_visible_note_rows``) — that helper is the
            # unit ROW_INVARIANT_REVIEW registers and the one worth reviewing.
            site = self.stack[0] if len(self.stack) == 1 else f"{self._enter()}.{_call_name(node)}"
            keywords = {kw.arg: kw.value for kw in node.keywords}
            self.sites.append(("list_hook", site, keywords.get("perm")))
        elif name == LIST_HOOK and callee is not LIST_HOOK_OBJ:
            # Spelled like the transport but not resolvable to it — never silently
            # pass an unaudited gate off as a scanned one.
            self.unresolved.append(f"{self._enter()} (unresolved {name})")
        elif callee is not None and getattr(callee, "__name__", None) in {"HasPerm", "HasRetvalPerm"}:
            keywords = {kw.arg: kw.value for kw in node.keywords}
            checker = keywords.get("perm_checker")
            if _resolve_object(checker, self.ns) is CAN_ANYWHERE_CHECKER_OBJ:
                perms = keywords.get("perms")
                if perms is None and node.args:
                    perms = node.args[0]
                self.sites.append(("checker", self._enter(), perms))
        self.generic_visit(node)


def _call_name(node: ast.Call) -> Optional[str]:
    func = node.func
    if isinstance(func, ast.Name):
        return func.id
    if isinstance(func, ast.Attribute):
        return func.attr
    return None


def _resolve_object(node: Optional[ast.expr], ns: dict[str, Any]) -> Any:
    """The object an expression refers to, via *ns* — or ``None``.

    Walks ``ast.Name`` and ``ast.Attribute`` chains only, and uses ``getattr``, so
    an alias (``from ... import can_anywhere_checker as checker``) and a
    module-qualified spelling (``permission_checkers.can_anywhere_checker``) both
    resolve to the same function object.  Never evaluates a call or any other
    expression, so it cannot run project code.
    """
    if isinstance(node, ast.Name):
        return ns.get(node.id)
    if isinstance(node, ast.Attribute):
        base = _resolve_object(node.value, ns)
        return getattr(base, node.attr, None) if base is not None else None
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


def _scan_module(module_name: str) -> tuple[list[tuple[str, str, Optional[list[str]]]], list[str]]:
    module = import_module(module_name)
    module_file = module.__file__
    assert module_file is not None  # imported project modules always have a file
    source = Path(module_file).read_text()
    tree = ast.parse(source)
    ns = vars(module)

    collector = _GateCollector(ns)
    collector.visit(tree)

    results: list[tuple[str, str, Optional[list[str]]]] = []
    for kind, site, expr in collector.sites:
        perms = _resolve(expr, ns)
        if perms is None and kind == "list_hook":
            perms = _resolve_hook_wrapper(tree, site, ns)
        results.append((kind, site, perms))
    return results, collector.unresolved


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
    sites, unresolved = _scan_module(module_name)
    assert not unresolved, (
        f"{module_name}: row-invariant transport(s) that could not be resolved to "
        "can_anywhere_checker/visible_rows_for_holder, so their gates cannot be audited. "
        "Import the transport directly (aliasing is fine) so the scan can see it:\n" + "\n".join(unresolved)
    )
    for _kind, site, perms in sites:
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
        for _kind, site, _perms in _scan_module(module_name)[0]
    }
    stale = sorted(key for key in ROW_INVARIANT_REVIEW if key not in scanned)
    assert not stale, f"stale ROW_INVARIANT_REVIEW entries: {stale}"


def test_aliased_transports_are_collected_like_plain_ones() -> None:
    """Regression: an alias must not hide a gate from the registry.

    The coverage scan uses raw text, so a module that aliases the checker still
    looked "covered" while the collector — matching ``checker.id`` against the
    literal name — recorded no site at all.  The gate was then neither declared
    nor registered, and nothing failed.  Resolving by identity closes that.
    """
    aliased = textwrap.dedent(
        """
        from common.graphql.permission_checkers import can_anywhere_checker as checker
        from common.graphql.permission_checkers import visible_rows_for_holder as hook

        class Query:
            thing: str = strawberry.field(
                extensions=[HasPerm(perms=["notes.view_note"], perm_checker=checker)]
            )

        def _rows(queryset, info):
            return hook(queryset, info, perm="notes.view_note", cache_key="rows")
        """
    )
    ns = {"HasPerm": HasPerm, "checker": CAN_ANYWHERE_CHECKER_OBJ, "hook": LIST_HOOK_OBJ}
    collector = _GateCollector(ns)
    collector.visit(ast.parse(aliased))

    kinds = {kind for kind, _site, _perms in collector.sites}
    assert kinds == {"checker", "list_hook"}, f"alias hid a gate: sites={collector.sites}"
    assert not collector.unresolved

    # And a transport spelled by name but never imported stays loud, not silent.
    ghost = _GateCollector({})
    ghost.visit(ast.parse("def f():\n    return visible_rows_for_holder(qs, info, perm='x', cache_key='y')\n"))
    assert ghost.sites == []
    assert ghost.unresolved, "an unresolvable transport must be reported, not dropped"


def test_every_module_using_a_row_invariant_transport_is_scanned() -> None:
    """No module may use a transport without being scanned.

    Coverage is decided by the same identity resolution the collector uses, so a
    module cannot hide a gate behind an alias, a qualified name, or any other
    spelling that a raw-text search would catch while the AST scan missed it.
    """
    allowed = set(ROW_INVARIANT_MODULES) | {"common.graphql.permission_checkers"}
    found: set[str] = set()
    unresolved: set[str] = set()
    for app_config in apps.get_app_configs():
        root = Path(app_config.path)
        for path in root.rglob("*.py"):
            if any(part in {"tests", "__pycache__", "migrations"} for part in path.parts):
                continue
            text = path.read_text()
            if CAN_ANYWHERE_CHECKER not in text and LIST_HOOK not in text:
                continue
            module = ".".join((app_config.label, *path.relative_to(root).with_suffix("").parts))
            module = module.removesuffix(".__init__")
            found.add(module)
            if module not in allowed:
                continue
            try:
                tree = ast.parse(text)
                ns = vars(import_module(module))
            except (ImportError, SyntaxError):  # pragma: no cover — a broken module fails elsewhere first
                continue
            collector = _GateCollector(ns)
            collector.visit(tree)
            if collector.unresolved:
                unresolved.update(f"{module}: {entry}" for entry in collector.unresolved)

    unexpected = sorted(found - allowed)
    assert not unexpected, (
        "module(s) use can_anywhere_checker/visible_rows_for_holder but are not scanned — "
        "add them to ROW_INVARIANT_MODULES and register their org-anchored sites: " + ", ".join(unexpected)
    )
    assert not unresolved, (
        "row-invariant transport(s) could not be resolved by the AST scan, so their gates are "
        "unregistered and unaudited:\n" + "\n".join(sorted(unresolved))
    )
