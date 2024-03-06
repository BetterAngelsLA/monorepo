from typing import Any

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone
from notes.models import Mood


@receiver(post_save, sender=Mood)
def post_save_mood_update_note_updated_at(
    sender: Mood, instance: Mood, **kwargs: Any
) -> None:
    instance.note.updated_at = timezone.now()
    instance.note.save()


@receiver(post_delete, sender=Mood)
def post_delete_mood_update_note_updated_at(
    sender: Mood, instance: Mood, **kwargs: Any
) -> None:
    instance.note.updated_at = timezone.now()
    instance.note.save()
