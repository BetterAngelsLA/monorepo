from _typeshed import Incomplete
from django.db import models
from simple_history.models import HistoricalRecords as HistoricalRecords

class DoYouKnow(models.Model): ...
class WhatIMean(DoYouKnow): ...

class Yar(models.Model):
    what: Incomplete
    history: Incomplete

class CustomAttrNameForeignKey(models.ForeignKey):
    attr_name: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...
    def get_attname(self): ...
    def deconstruct(self): ...

class ModelWithCustomAttrForeignKey(models.Model):
    what_i_mean: Incomplete
    history: Incomplete

class CustomAttrNameOneToOneField(models.OneToOneField):
    attr_name: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...
    def get_attname(self): ...
    def deconstruct(self): ...

class ModelWithCustomAttrOneToOneField(models.Model):
    what_i_mean: Incomplete
    history: Incomplete
