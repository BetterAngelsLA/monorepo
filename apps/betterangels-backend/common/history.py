# Base class for revert behavior
class RevertibleTrackedModel:
    @classmethod
    def revert(cls, event_type: str, instance_id: int):
        """
        Reverts the specified event by undoing the effect of an 'add' or 'remove' event.

        Args:
            event_type (str): The type of event ('add' or 'remove').
            instance_id (int): The ID of the instance to revert.
        """
        if event_type == 'add':
            # Undo an 'add' event by deleting the object
            cls.objects.filter(pk=instance_id).delete()
        elif event_type == 'remove':
            # Undo a 'remove' event by re-creating the object (requires access to historical data)
            history = pghistory.models.Event.objects.filter(
                related_model=cls._meta.db_table,
                pk=instance_id,
                event_type='group.remove'
            ).first()
            if history:
                cls.objects.create(**history.data)
        else:
            raise ValueError(f"Unsupported event type: {event_type}")
