from . import populate_history as populate_history
from ... import models as models, utils as utils
from ...exceptions import NotHistoricalModelError as NotHistoricalModelError
from _typeshed import Incomplete
from django.db import transaction as transaction

class Command(populate_history.Command):
    args: str
    help: str
    DONE_CLEANING_FOR_MODEL: str
    def add_arguments(self, parser) -> None: ...
    verbosity: Incomplete
    def handle(self, *args, **options) -> None: ...
    def log(self, message, verbosity_level: int = ...) -> None: ...
