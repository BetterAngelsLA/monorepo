from _typeshed import Incomplete
from simple_history.exceptions import AlternativeManagerError as AlternativeManagerError, NotHistoricalModelError as NotHistoricalModelError

def update_change_reason(instance, reason) -> None: ...
def get_history_manager_for_model(model): ...
def get_history_manager_from_history(history_instance): ...
def get_history_model_for_model(model): ...
def get_app_model_primary_key_name(model): ...
def bulk_create_with_history(objs, model, batch_size: Incomplete | None = ..., ignore_conflicts: bool = ..., default_user: Incomplete | None = ..., default_change_reason: Incomplete | None = ..., default_date: Incomplete | None = ...): ...
def bulk_update_with_history(objs, model, fields, batch_size: Incomplete | None = ..., default_user: Incomplete | None = ..., default_change_reason: Incomplete | None = ..., default_date: Incomplete | None = ..., manager: Incomplete | None = ...): ...
def get_change_reason_from_object(obj): ...
