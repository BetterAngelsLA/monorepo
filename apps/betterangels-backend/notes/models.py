from accounts.models import User
from django.db import models


class Note(models.Model):
    id: int
    title = models.CharField(max_length=100)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

    def __str__(self) -> str:
        return self.body[:50]
