from _typeshed import Incomplete
from django.db import models

class AutoCreatedField(models.DateTimeField):
    def __init__(self, *args, **kwargs) -> None: ...

class AutoLastModifiedField(AutoCreatedField):
    def pre_save(self, model_instance, add): ...

ORGS_SLUGFIELD: Incomplete
module: Incomplete
klass: Incomplete
BaseSlugField: Incomplete

class SlugField(BaseSlugField): ...
