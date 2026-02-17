import { z } from 'zod';
import {
  CreateNoteServiceInput,
  LocationInput,
  SelahTeamEnum,
  TaskStatusEnum,
  ViewNoteQuery,
} from '../../apollo';

// ── Task sub-schema (same shape as HMIS DraftTask) ─────────────────────
export const TaskFormSchema = z.object({
  id: z.string().optional(),
  summary: z.string().nullable(),
  team: z.enum(SelahTeamEnum).nullable(),
  description: z.string().nullable(),
  status: z.enum(TaskStatusEnum).nullable(),
  markedForDeletion: z.boolean().optional(),
});

export type DraftTask = z.infer<typeof TaskFormSchema>;

// ── Service sub-schema ──────────────────────────────────────────────────
const ServiceInputSchema = z.custom<CreateNoteServiceInput>();

// ── Location sub-schema ─────────────────────────────────────────────────
const LocationSchema = z.custom<LocationInput>().nullable();

// ── Main form schema ────────────────────────────────────────────────────
export const NoteFormSchema = z.object({
  purpose: z.string().nullable().optional(),
  interactedAt: z.string().nullable().optional(),
  team: z.enum(SelahTeamEnum).nullable().optional(),
  location: LocationSchema,
  providedServices: z.array(ServiceInputSchema),
  requestedServices: z.array(ServiceInputSchema),
  tasks: z.array(TaskFormSchema),
  publicNote: z.string(),
});

export type TNoteFormInputs = z.input<typeof NoteFormSchema>;

// ── Empty state ─────────────────────────────────────────────────────────
export const NOTE_FORM_EMPTY_STATE: TNoteFormInputs = {
  purpose: undefined,
  interactedAt: undefined,
  team: undefined,
  location: null,
  providedServices: [],
  requestedServices: [],
  tasks: [],
  publicNote: '',
};

// ── Task status → int mapping (CreateNoteTaskInput.status is Int) ───────
const TASK_STATUS_TO_INT: Record<TaskStatusEnum, number> = {
  [TaskStatusEnum.ToDo]: 0,
  [TaskStatusEnum.InProgress]: 1,
  [TaskStatusEnum.Completed]: 2,
};

// ── Output transform: form state → mutation payload ─────────────────────

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

  const payload: Record<string, unknown> = {};

  if (include('purpose')) payload.purpose = form.purpose;
  if (include('interactedAt')) payload.interactedAt = form.interactedAt;
  if (include('team')) payload.team = form.team;
  if (include('publicNote'))
    payload.publicDetails = form.publicNote || undefined;
  if (include('location')) payload.location = form.location || undefined;
  if (include('providedServices'))
    payload.providedServices = form.providedServices;
  if (include('requestedServices'))
    payload.requestedServices = form.requestedServices;
  if (include('tasks'))
    payload.tasks = form.tasks.map((t) => ({
      summary: t.summary || '',
      description: t.description || undefined,
      status: t.status != null ? TASK_STATUS_TO_INT[t.status] : undefined,
      team: t.team || undefined,
    }));

  if (isSubmitted !== undefined) payload.isSubmitted = isSubmitted;

  return payload;
}

// ── Map server query → form values ──────────────────────────────────────
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
      (s: {
        service?: {
          id?: string;
          label?: string;
          category?: { id: string } | null;
        } | null;
      }) => ({
        serviceId: s.service?.id,
        serviceOther: s.service?.category ? undefined : s.service?.label,
      })
    ),
    requestedServices: (note.requestedServices ?? []).map(
      (s: {
        service?: {
          id?: string;
          label?: string;
          category?: { id: string } | null;
        } | null;
      }) => ({
        serviceId: s.service?.id,
        serviceOther: s.service?.category ? undefined : s.service?.label,
      })
    ),
    tasks: (note.tasks ?? []).map((t) => ({
      id: t.id,
      summary: t.summary ?? null,
      description: t.description ?? null,
      status: t.status ?? null,
      team: t.team ?? null,
    })),
  };
}

// ── Field names (for server error mapping) ──────────────────────────────
type NoteFormFieldName = keyof typeof NoteFormSchema.shape;

export const NoteFormFieldNames = Object.keys(
  NoteFormSchema.shape
) as NoteFormFieldName[];
