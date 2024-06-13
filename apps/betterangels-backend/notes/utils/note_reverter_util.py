from uuid import UUID

from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from notes.models import Note
from pghistory.models import Context, Events


class NoteReverter:
    """
    This class will revert the specified Note, and all of it's related models back to their state at the saved_at timestamp.

    The only exception is NoteAttachments which rely on s3 storage and will not be affected by version control.
    See NOTE_RELATED_MODEL_UPDATES for revertable actions.

    Example usage:

        NoteReverter(note_id="100").revert_to_saved_at(saved_at="2024-03-11T10:11:12+00:00")

    """

    NOTE_RELATED_MODEL_UPDATES = {
        "addNoteTask",
        "createNoteMood",
        "createNoteServiceRequest",
        "createNoteTask",
        "deleteMood",
        "deleteServiceRequest",
        "deleteTask",
        "removeNoteServiceRequest",
        "removeNoteTask",
        "updateNoteLocation",
        "updateServiceRequest",
        "updateTask",
        "updateTaskLocation",
    }

    def __init__(self, note_id: str):
        self.note_id = note_id

    @staticmethod
    def _revert_changes_to_related_real_models(context_ids: list[UUID]) -> None:
        """
        Reverts changes made to Note-related REAL model instances (have pgh_obj_id, i.e., Locations, Moods)
        """
        for event in Events.objects.filter(pgh_context_id__in=context_ids, pgh_obj_id__isnull=False):
            action = event.pgh_label.split(".")[1]
            try:
                apps.get_model(event.pgh_model).objects.get(
                    id=event.pgh_obj_id,
                    pgh_context_id__in=context_ids,
                ).pgh_obj.revert_action(action=action, diff=event.pgh_diff)

            except ObjectDoesNotExist:
                # If object has already been deleted, restore it
                apps.get_model(event.pgh_model).objects.get(
                    pgh_context_id=event.pgh_context_id, id=event.pgh_obj_id
                ).revert()

        return

    @staticmethod
    def _revert_changes_to_related_proxy_models(events: list[Events]) -> list[Events]:
        """
        Revert changes made to Note-related PROXY model instances (no pgh_obj_id, i.e., Tasks, Services)
        Returns list of failed revert events that need to be retried after the real models are reverted.

        NOTE: When reverting changes to RETURN REMOVED Proxy Models, e.g., put back a deleted NotePurpose (Task instance),
        the first time we try to revert the "delete" NotePurpose action it will fail because the related Task has been deleted and
        the NotePurpose relationship can only be brought back AFTER the REAL model changes have been reverted.

        Similarly, when reverting changes to REMOVE ADDED Proxy Models, e.g., discard an added NotePurpose (Task instance),
        if we try to revert the "create" Task action, before reverting the "create" NotePurpose action, it will fail because
        the NotePurpose tied to the Task will block deletion.

        To satisfy both cases, we save the failed revert events and try them again after the _revert_changes_to_related_real_models
        fn has been called.
        """

        failed_revert_events = []
        for event in events:
            try:
                action = event.pgh_label.split(".")[1]
                apps.get_model(event.pgh_model).pgh_tracked_model.revert_action(action=action, **event.pgh_data)

            except ObjectDoesNotExist:
                failed_revert_events.append(event)

        return failed_revert_events

    def _revert_changes_to_all_related_models(self, saved_at: str) -> None:
        # Find contexts affecting Note-related models that were created AFTER saved_at time
        contexts_to_revert: list[UUID] = list(
            Context.objects.filter(
                metadata__note_id=self.note_id,
                metadata__label__in=self.NOTE_RELATED_MODEL_UPDATES,
                metadata__timestamp__gt=saved_at,
            ).values_list("id", flat=True)
        )

        proxy_events_to_revert = list(Events.objects.filter(pgh_context_id__in=contexts_to_revert, pgh_obj_id=None))

        # See fn notes for details
        failed_revert_events = self._revert_changes_to_related_proxy_models(events=proxy_events_to_revert)

        self._revert_changes_to_related_real_models(context_ids=contexts_to_revert)

        failed_revert_events = self._revert_changes_to_related_proxy_models(events=failed_revert_events)

        if failed_revert_events:
            raise Exception("The revert action could not revert all associated Note models")

        return

    @transaction.atomic
    def revert_to_saved_at(self, saved_at: str) -> None:
        """
        This function will revert the Note back to it's state at the saved_at timestamp.
        """

        revert_to_note_context_id: UUID | None = None

        update_note_contexts = Context.objects.filter(metadata__note_id=self.note_id, metadata__label="updateNote")

        if update_note_contexts.exists():
            # Find context for most recent Note instance update BEFORE saved_at time
            if revert_to_note_context := (
                update_note_contexts.filter(
                    metadata__timestamp__lte=saved_at,
                )
                .order_by("metadata__timestamp")
                .last()
            ):
                revert_to_note_context_id = revert_to_note_context.id

        self._revert_changes_to_all_related_models(saved_at=saved_at)

        # Revert just the Note instance
        if revert_to_note_context_id:
            event = Events.objects.get(
                pgh_context_id=revert_to_note_context_id,
                pgh_obj_model="notes.Note",
            )
            apps.get_model(event.pgh_model).objects.get(
                pgh_context_id=event.pgh_context_id, id=event.pgh_obj_id
            ).revert()

        # If all updates occurred after saved_at, revert to Note instance's creation event
        elif update_note_contexts.exists():
            Note.objects.get(id=self.note_id).events.get(pgh_label="note.add").revert()

        # Discard contexts that were created after saved_at time
        update_note_contexts.filter(metadata__timestamp__gt=saved_at).delete()

        return
