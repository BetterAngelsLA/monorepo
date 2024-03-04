from typing import Any

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from notes.models import Note


@receiver(post_save, sender=Note)
def update_last_saved_at(sender: Note, instance: Note, **kwargs: Any) -> None:
    if instance.pk is None:
        return

    if instance.is_saved and not instance.history.first().prev_record.is_saved:
        # disconnect signal temporarily to avoid infitite loop
        post_save.disconnect(update_last_saved_at, sender=Note)

        instance.last_saved_at = timezone.now()
        instance.save()

        post_save.connect(update_last_saved_at, sender=Note)
