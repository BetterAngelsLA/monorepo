from ... import models as models, utils as utils
from ...exceptions import NotHistoricalModelError as NotHistoricalModelError
from _typeshed import Incomplete
from django.core.management.base import BaseCommand

get_model: Incomplete

class Command(BaseCommand):
    args: str
    help: str
    COMMAND_HINT: str
    MODEL_NOT_FOUND: str
    MODEL_NOT_HISTORICAL: str
    NO_REGISTERED_MODELS: str
    START_SAVING_FOR_MODEL: str
    DONE_SAVING_FOR_MODEL: str
    EXISTING_HISTORY_FOUND: str
    INVALID_MODEL_ARG: str
    def add_arguments(self, parser) -> None: ...
    verbosity: Incomplete
    def handle(self, *args, **options) -> None: ...
