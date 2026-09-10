"""Meta-test — every mutation in a grant-cutover module must gate on grants.

ADR 0001 makes the grant predicates the authority for cut-over domains.  A new
or edited mutation that forgets its gate fails silently in one of two ways: it
serves an unauthorized caller, or it refuses a legitimate one.  This tripwire
walks the cut-over schema modules and fails unless each mutation:

1. gates in its own body — ``require_can(`` / ``can_anywhere(`` / ``can_obj(`` /
   ``visible(`` or a scoped load (``permission=`` — ADR §2.6: the scoped
   ``*_get``/``*_queryset`` load *is* the write check), or a declarative
   field's grant checker (``can_anywhere_checker`` / ``can_obj_checker``), or
2. delegates to a service/selector function in its own app that does, or
3. is listed in ``GATE_EXEMPT`` — deliberately, with the reason.

It is a heuristic tripwire, not a proof: the gate test is a string match over
resolver and delegated sources, one delegation hop deep.  When it fails, either
add the gate or add an exemption entry explaining why the mutation needs none.
"""

import ast
from importlib import import_module
from pathlib import Path

import pytest

# Apps whose org-scoped mutations are grant-gated (ADR 0001).  A domain joins
# this list the moment it cuts over — see the readiness matrix in the ADR §4.1.
GRANT_GATED_MODULES = (
    "accounts.schema",
    "clients.schema",
    "reports.schema",
    "shelters.schema",
    "tasks.schema",
    "teams.schema",
)

# ``permission=`` counts because the scoped selectors (``*_get``/``*_queryset``)
# take the permission and scope by the caller's grants — the ADR §2.6 write
# check for update/delete.  The ``*_checker`` names count because declarative
# strawberry fields (auto mutations, payload-typed fields) flip enforcement by
# swapping the predicate to the grant model rather than rewriting the field.
GATE_MARKERS = (
    "require_can(",
    "can_anywhere(",
    "can_obj(",
    "visible(",
    "permission=",
    "can_anywhere_checker",
)

# Mutations allowed to skip a grant gate, each with the reason it needs none.
GATE_EXEMPT = {
    ("accounts.schema", "login"): "authentication — no org in scope",
    ("accounts.schema", "logout"): "authentication — no org in scope",
    ("accounts.schema", "update_current_user"): "self-service — the caller's own account, never org-scoped",
    ("accounts.schema", "update_user_profile"): "self-service — the caller's own profile, never org-scoped",
    ("accounts.schema", "delete_current_user"): "self-service — the caller's own account, never org-scoped",
    ("accounts.schema", "create_organization"): (
        "org creation itself — no org authority exists yet; eligibility lives in create_organization_service"
    ),
    ("clients.schema", "delete_client_document"): (
        "attachment-domain gate (PermissionedQuerySet) — documents cut over with the CREATOR/UPLOADER tier (RFC 0002)"
    ),
    ("clients.schema", "update_client_document"): (
        "attachment-domain gate — documents cut over with the CREATOR/UPLOADER tier (RFC 0002)"
    ),
    ("clients.schema", "generate_client_document_uploads"): (
        "attachment perms + legacy client CHANGE load — documents cut over with the CREATOR/UPLOADER tier (RFC 0002)"
    ),
    ("clients.schema", "resolve_client_document_uploads"): (
        "attachment perms + legacy client CHANGE load — documents cut over with the CREATOR/UPLOADER tier (RFC 0002)"
    ),
    ("clients.schema", "create_client_profile_data_import"): (
        "import surfaces remain legacy until a role carries the import-record perms"
    ),
    ("clients.schema", "import_client_profile"): (
        "import surfaces remain legacy until a role carries the import-record perms"
    ),
}


def _app_dir(app: str) -> Path:
    return Path(import_module(app).__path__[0])


def _mutation_resolvers(app: str) -> list[tuple[str, str]]:
    """(name, source) for every mutation surface in ``class Mutation``.

    Two shapes: ``@mutation``-decorated defs, and annotated assignments whose
    value is a declarative ``mutations.*`` factory (auto-generated create /
    update / delete fields — payload typed, so their enforcement flips via the
    grant checkers rather than a rewritten body).
    """
    src = (_app_dir(app) / "schema.py").read_text()
    tree = ast.parse(src)
    resolvers: list[tuple[str, str]] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef) or node.name != "Mutation":
            continue
        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                if not any("mutation" in ast.unparse(decorator) for decorator in item.decorator_list):
                    continue
                # ``get_source_segment`` on a FunctionDef excludes its decorators;
                # include them — gates like ``perm_checker=can_anywhere_checker``
                # live there.
                decorators = "\n".join(
                    ast.get_source_segment(src, decorator) or "" for decorator in item.decorator_list
                )
                segment = f"{decorators}\n{ast.get_source_segment(src, item) or ''}"
                resolvers.append((item.name, segment))
            elif isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                segment = ast.get_source_segment(src, item) or ""
                if "mutations." not in segment:
                    continue
                resolvers.append((item.target.id, segment))
    return resolvers


def _gated(source: str) -> bool:
    return any(marker in source for marker in GATE_MARKERS)


def _delegated_sources(app: str) -> dict[str, list[str]]:
    """Function name → sources, across the app's ``services``/``selectors`` modules."""
    root = _app_dir(app)
    paths = [root / "services.py", root / "selectors.py"]
    for package in ("services", "selectors"):
        directory = root / package
        if directory.is_dir():
            paths.extend(directory.glob("*.py"))

    sources: dict[str, list[str]] = {}
    for path in paths:
        if not path.exists():
            continue
        module_src = path.read_text()
        try:
            tree = ast.parse(module_src)
        except SyntaxError:  # pragma: no cover — a broken module fails elsewhere first
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                sources.setdefault(node.name, []).append(ast.get_source_segment(module_src, node) or "")
    return sources


def _called_names(source: str) -> set[str]:
    names: set[str] = set()
    for node in ast.walk(ast.parse(source)):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if isinstance(func, ast.Name):
            names.add(func.id)
        elif isinstance(func, ast.Attribute):
            names.add(func.attr)
    return names


@pytest.mark.parametrize("module_name", GRANT_GATED_MODULES)
def test_every_mutation_in_a_grant_cutover_module_gates(module_name: str) -> None:
    app = module_name.split(".", 1)[0]
    delegates = _delegated_sources(app)

    ungated: list[str] = []
    for name, source in _mutation_resolvers(app):
        if (module_name, name) in GATE_EXEMPT or _gated(source):
            continue
        delegated_gated = any(
            _gated(delegate_source) for called in _called_names(source) for delegate_source in delegates.get(called, [])
        )
        if not delegated_gated:
            ungated.append(name)

    assert not ungated, (
        f"{module_name}: mutation(s) without a grant gate: {sorted(ungated)}. "
        "Gate with require_can()/can_obj() — or a scoped *_get/*_queryset load in the resolver "
        "or a service it delegates to — or add a GATE_EXEMPT entry with the reason."
    )


def test_exemptions_name_real_mutations_and_carry_a_reason() -> None:
    for (module_name, name), reason in GATE_EXEMPT.items():
        assert reason, f"{module_name}.{name}: exemption needs a reason"
        resolvers = {resolver_name for resolver_name, _ in _mutation_resolvers(module_name.split(".", 1)[0])}
        assert name in resolvers, f"{module_name}.{name} is exempted but no such mutation exists any more"


@pytest.mark.parametrize("module_name", GRANT_GATED_MODULES)
def test_configured_modules_still_exist(module_name: str) -> None:
    """A renamed/moved module must fail loudly, not silently leave the net open."""
    assert (_app_dir(module_name.split(".", 1)[0]) / "schema.py").exists()
