from uuid import UUID

from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from notes.models import Note
from pghistory.models import Context, Events


class NoteReverter:
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
                ).pgh_obj.revert_action(action=action, diff=event.pgh_diff, obj_id=event.pgh_obj_id)

            except ObjectDoesNotExist:
                # If object has already been deleted, restore it
                apps.get_model(event.pgh_model).objects.get(
                    pgh_context_id=event.pgh_context_id, id=event.pgh_obj_id
                ).revert()

        return None

    @staticmethod
    def _revert_changes_to_related_proxy_models(context_ids: list[UUID]) -> None:
        """
        Revert changes made to Note-related PROXY model instances (no pgh_obj_id, i.e., Tasks, Services)
        """
        for event in Events.objects.filter(pgh_context_id__in=context_ids, pgh_obj_id=None):
            action = event.pgh_label.split(".")[1]

            apps.get_model(event.pgh_model).pgh_tracked_model.revert_action(action=action, **event.pgh_data)

        return None

    @classmethod
    def _revert_changes_to_all_related_models(cls, note_id: str, saved_at: str) -> None:
        NOTE_RELATED_MODEL_UPDATES = {
            "createNoteMood",
            "addNoteTask",
            "createNoteTask",
            "createNoteServiceRequest",
            "deleteMood",
            "deleteTask",
            "deleteServiceRequest",
            "removeNoteTask",
            "removeNoteServiceRequest",
            "updateNoteLocation",
            # TODO: add mutations that affect models that are related to Note
        }

        # Find contexts affecting Note-related models that were created AFTER saved_at time
        contexts_to_revert: list[UUID] = list(
            Context.objects.filter(
                metadata__note_id=note_id,
                metadata__label__in=NOTE_RELATED_MODEL_UPDATES,
                metadata__timestamp__gt=saved_at,
            ).values_list("id", flat=True)
        )

        # NOTE: sometimes PROXY models need to be updated BEFORE the REAL models and sometimes they need to be updated
        # AFTER the REAL models. Use this variable to determine whether to run the proxy model revert fn again later
        try_again_after_real_models_revert: bool = False

        try:
            cls._revert_changes_to_related_proxy_models(context_ids=contexts_to_revert)

        except ObjectDoesNotExist:
            try_again_after_real_models_revert = True

        cls._revert_changes_to_related_real_models(context_ids=contexts_to_revert)

        if try_again_after_real_models_revert:
            cls._revert_changes_to_related_proxy_models(context_ids=contexts_to_revert)

        return

    @transaction.atomic
    def revert_to_saved_at(self, saved_at: str):
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

        self._revert_changes_to_all_related_models(note_id=self.note_id, saved_at=saved_at)

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
