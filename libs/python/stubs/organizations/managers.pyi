from django.db import models

class OrgManager(models.Manager):
    def get_for_user(self, user): ...

class ActiveOrgManager(OrgManager):
    def get_queryset(self): ...
