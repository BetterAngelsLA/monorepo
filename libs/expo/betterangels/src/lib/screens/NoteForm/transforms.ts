import { CreateNoteInput, TaskStatusEnum, ViewNoteQuery } from '../../apollo';
import { TNoteFormInputs } from './schema';

const TASK_STATUS_TO_INT: Record<TaskStatusEnum, number> = {
  [TaskStatusEnum.ToDo]: 0,
  [TaskStatusEnum.InProgress]: 1,
  [TaskStatusEnum.Completed]: 2,
};

type DirtyFields = Partial<Record<keyof TNoteFormInputs, boolean | object>>;

/**
 * Build the GraphQL mutation payload from form state.
 *
 * When `dirtyFields` is provided (updates), only changed fields are included.
 * Omitted fields stay as `UNSET` on the backend and are not touched.
 * When `dirtyFields` is omitted (creates), all fields are sent.
 */
export function buildNotePayload(
  form: TNoteFormInputs,
  isSubmitted?: boolean,
  dirtyFields?: DirtyFields
) {
  const include = (field: keyof TNoteFormInputs) =>
    !dirtyFields || !!dirtyFields[field];

  const payload: Partial<CreateNoteInput> = {};

  if (include('purpose')) payload.purpose = form.purpose;
  if (include('interactedAt')) payload.interactedAt = form.interactedAt;
  if (include('team')) payload.team = form.team;
  if (include('publicNote')) {
    payload.publicDetails = form.publicNote || undefined;
  }
  if (include('location')) payload.location = form.location || undefined;
  if (include('providedServices')) {
    payload.providedServices = form.providedServices.map(
      ({ label: _label, ...rest }) => rest
    );
  }
  if (include('requestedServices')) {
    payload.requestedServices = form.requestedServices.map(
      ({ label: _label, ...rest }) => rest
    );
  }
  if (include('tasks')) {
    payload.tasks = form.tasks.map((task) => ({
      summary: task.summary || '',
      description: task.description || undefined,
      status: task.status != null ? TASK_STATUS_TO_INT[task.status] : undefined,
      team: task.team || undefined,
    }));
  }

  if (isSubmitted !== undefined) payload.isSubmitted = isSubmitted;

  return payload;
}

export function formDataFromNote(note: ViewNoteQuery['note']): TNoteFormInputs {
  return {
    purpose: note.purpose,
    interactedAt: note.interactedAt,
    team: note.team,
    publicNote: note.publicDetails || '',
    location: note.location?.point
      ? {
          point: note.location.point,
          address: note.location.address
            ? {
                formattedAddress: [
                  note.location.address.street,
                  note.location.address.city,
                  note.location.address.state,
                  note.location.address.zipCode,
                ]
                  .filter(Boolean)
                  .join(', '),
              }
            : undefined,
        }
      : null,
    providedServices: (note.providedServices ?? []).map(
      (service: {
        service?: {
          id?: string;
          label?: string;
          category?: { id: string } | null;
        } | null;
      }) => ({
        serviceId: service.service?.id,
        label: service.service?.label,
        serviceOther: service.service?.category
          ? undefined
          : service.service?.label,
      })
    ),
    requestedServices: (note.requestedServices ?? []).map(
      (service: {
        service?: {
          id?: string;
          label?: string;
          category?: { id: string } | null;
        } | null;
      }) => ({
        serviceId: service.service?.id,
        label: service.service?.label,
        serviceOther: service.service?.category
          ? undefined
          : service.service?.label,
      })
    ),
    tasks: (note.tasks ?? []).map((task) => ({
      id: task.id,
      summary: task.summary ?? null,
      description: task.description ?? null,
      status: task.status ?? null,
      team: task.team ?? null,
    })),
  };
}
