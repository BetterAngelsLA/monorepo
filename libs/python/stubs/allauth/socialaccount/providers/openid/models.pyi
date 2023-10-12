from _typeshed import Incomplete
from django.db import models

class OpenIDStore(models.Model):
    server_url: Incomplete
    handle: Incomplete
    secret: Incomplete
    issued: Incomplete
    lifetime: Incomplete
    assoc_type: Incomplete

class OpenIDNonce(models.Model):
    server_url: Incomplete
    timestamp: Incomplete
    salt: Incomplete
    date_created: Incomplete
