from typing import Any, Callable, Optional, Union

from django.db import transaction
from strawberry_django.permissions import (
    HasRetvalPerm,
    Info,
    PermDefinition,
    PermTarget,
    UserType,
)


class AtomicHasRetvalPerm(HasRetvalPerm):
    def __init__(
        self,
        perms: Union[list[str], str],
        *,
        message: Optional[str] = None,
        use_directives: bool = True,
        fail_silently: bool = False,  # ← default flipped
        target: Optional[PermTarget] = None,
        any_perm: bool = True,
        perm_checker: Optional[Callable[[Info, UserType], Callable[[PermDefinition], bool]]] = None,
        obj_perm_checker: Optional[Callable[[Info, UserType], Callable[[PermDefinition, Any], bool]]] = None,
        with_anonymous: bool = True,
        with_superuser: bool = False,
    ) -> None:
        super().__init__(
            perms=perms,
            message=message,
            use_directives=use_directives,
            fail_silently=fail_silently,
            target=target,
            any_perm=any_perm,
            perm_checker=perm_checker,
            obj_perm_checker=obj_perm_checker,
            with_anonymous=with_anonymous,
            with_superuser=with_superuser,
        )

    def resolve(
        self,
        next_: Callable[..., Any],
        source: Any,
        info: Info,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        with transaction.atomic():
            return super().resolve(next_, source, info, *args, **kwargs)
