import { z } from 'zod';
import {
  CreateNoteServiceInput,
  LocationInput,
  SelahTeamEnum,
} from '../../apollo';
import { TaskFormSchema } from '../../ui-components/TaskForm';

/** Form-local extension of the GraphQL input – carries a display label. */
export type NoteFormServiceItem = CreateNoteServiceInput & { label?: string };

const ServiceInputSchema = z.custom<NoteFormServiceItem>();

const LocationSchema = z.custom<LocationInput>().nullable();

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

export type DraftTask = z.infer<typeof TaskFormSchema>;

export type TNoteFormInputs = z.input<typeof NoteFormSchema>;

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

type NoteFormFieldName = keyof typeof NoteFormSchema.shape;

export const NoteFormFieldNames = Object.keys(
  NoteFormSchema.shape
) as NoteFormFieldName[];
