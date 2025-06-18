import inspect
from typing import Any, Callable, Optional, Type, Union

from django.db.models import Model, QuerySet
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import (
    HasRetvalPerm,
    PermDefinition,
    PermTarget,
    UserType,
)
from strawberry_django.utils.query import filter_for_user


class PermissionedQuerySet(HasRetvalPerm):
    """
    Wraps HasRetvalPerm in a DB transaction and injects a permission-filtered QuerySet into context,
    inferring the model from the permission definition if not explicitly provided.
    """

    def __init__(
        self,
        perms: Union[list[str], str],
        *,
        model: Type[Model],
        message: Optional[str] = None,
        use_directives: bool = True,
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
            fail_silently=False,
            target=target,
            any_perm=any_perm,
            perm_checker=perm_checker,
            obj_perm_checker=obj_perm_checker,
            with_anonymous=with_anonymous,
            with_superuser=with_superuser,
        )
        self.model = model

    def _prepare_qs(self, info: Info) -> QuerySet[Model]:
        user = get_current_user(info)
        qs: QuerySet[Model] = filter_for_user(self.model.objects.all(), user, self.permissions)  # type: ignore
        return qs

    def resolve(
        self,
        next_: Callable[..., Any],
        source: Any,
        info: Info,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        # Inject filtered QuerySet into context
        info.context.qs = self._prepare_qs(info)
        return super().resolve(next_, source, info, *args, **kwargs)

    async def resolve_async(
        self,
        next_: Callable[..., Any],
        source: Any,
        info: Info,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        info.context.qs = self._prepare_qs(info)
        result = super().resolve_async(next_, source, info, *args, **kwargs)
        if inspect.isawaitable(result):
            result = await result  # type: ignore
        return result
