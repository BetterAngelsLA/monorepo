from typing import Any

import strawberry


def strip_unset(obj: Any) -> Any:
    """Recursively remove strawberry.UNSET values from nested dicts/lists.

    Use after ``strawberry.asdict()`` to ensure UNSET sentinels in optional
    nested inputs don't leak into service/model layers that expect plain
    Python types.

    >>> strip_unset({"a": 1, "b": strawberry.UNSET, "c": {"d": strawberry.UNSET, "e": 2}})
    {'a': 1, 'c': {'e': 2}}
    """
    if isinstance(obj, dict):
        return {k: strip_unset(v) for k, v in obj.items() if v is not strawberry.UNSET}
    if isinstance(obj, list):
        return [strip_unset(item) for item in obj]
    return obj
