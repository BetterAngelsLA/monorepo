import type {
  CreateReservationInput,
  ReservationClientInput,
  UpdateReservationInput,
} from '../../../apollo/graphql/__generated__/types';
import type { ReservationFormData } from '../reservation-form/formTypes';

const toInputString = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const buildClientsInput = (
  clientIds: string[],
  primaryClientId: string | null
): ReservationClientInput[] =>
  clientIds.map((id) => ({
    clientProfileId: id,
    isPrimary: id === primaryClientId,
  }));

export const buildCreateReservationInput = (
  formData: ReservationFormData
): CreateReservationInput => ({
  bedId: formData.bedId ?? undefined,
  roomId: formData.roomId ?? undefined,
  status: formData.status,
  startDate: formData.startDate || undefined,
  notes: toInputString(formData.notes),
  clients: buildClientsInput(formData.clientIds, formData.primaryClientId),
});

export const buildUpdateReservationInput = (
  formData: ReservationFormData
): UpdateReservationInput =>
  ({
    bedId: formData.bedId ?? undefined,
    roomId: formData.roomId ?? undefined,
    startDate: formData.startDate || undefined,
    notes: toInputString(formData.notes),
    clients: buildClientsInput(formData.clientIds, formData.primaryClientId),
  } as UpdateReservationInput);
