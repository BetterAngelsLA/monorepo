from typing import Any

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Shelter, ShelterAvailability


@receiver(post_save, sender=Shelter)
def create_shelter_availability(sender: Any, instance: Shelter, created: bool, **kwargs: Any) -> None:
    if created:
        ShelterAvailability.objects.get_or_create(shelter=instance)
