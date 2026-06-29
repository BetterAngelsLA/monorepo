import { z } from 'zod';
import { ReservationStatusChoices } from '../../../../apollo/graphql/__generated__/types';

export const formSchema = z
  .object({
    bedId: z.string().nullable(),
    roomId: z.string().nullable(),
    clientIds: z.array(z.string()).min(1, 'At least one client is required'),
    primaryClientId: z.string().nullable(),
    status: z.enum(ReservationStatusChoices),
    startDate: z.string().min(1, 'Start date is required'),
    notes: z.string(),
  })
  .refine((data) => data.bedId || data.roomId, {
    message: 'At least one of Bed or Room must be selected.',
    path: ['bedId'],
  })
  .refine(
    (data) => {
      if (data.clientIds.length <= 1) return true;
      return (
        data.primaryClientId !== null &&
        data.clientIds.includes(data.primaryClientId)
      );
    },
    {
      message:
        'A primary client must be selected when there are multiple clients.',
      path: ['primaryClientId'],
    }
  );
