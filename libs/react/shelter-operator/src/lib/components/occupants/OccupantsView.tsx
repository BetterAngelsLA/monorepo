import { useQuery } from '@apollo/client/react';
import { formatClientDisplayName } from '@monorepo/react/shared';
import { useMemo } from 'react';
import { ReservationStatusChoices } from '../../apollo/graphql/__generated__/types';
import { OccupantTable } from '../OccupantTable';
import {
  GetReservationsDocument,
  type GetReservationsQuery,
  type GetReservationsQueryVariables,
} from '../reservations/api/__generated__/reservationQueries.generated';

const ACTIVE_STATUSES: Set<ReservationStatusChoices> = new Set([
  ReservationStatusChoices.Confirmed,
  ReservationStatusChoices.CheckedIn,
  ReservationStatusChoices.CheckInOverdue,
]);

type ReservationResult = NonNullable<
  GetReservationsQuery['reservations']['results'][number]
>;

type OccupantRow = {
  id: string;
  clientName: string;
  status: ReservationStatusChoices;
  roomName: string | null;
  bedName: string | null;
  startDate: string | null;
};

export function OccupantsView({ shelterId }: { shelterId: string }) {
  const { data, loading } = useQuery<
    GetReservationsQuery,
    GetReservationsQueryVariables
  >(GetReservationsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const rows: OccupantRow[] = useMemo(() => {
    const results: ReservationResult[] = data?.reservations.results ?? [];
    return results
      .filter((r) => ACTIVE_STATUSES.has(r.status))
      .flatMap((r) => {
        const clients = r.clients ?? [];
        if (clients.length === 0) {
          const primaryDisplay = '—';
          return [
            {
              id: r.id,
              clientName: primaryDisplay,
              status: r.status,
              roomName: r.room?.name ?? null,
              bedName: r.bed?.name ?? null,
              startDate: r.startDate ?? null,
            },
          ];
        }
        return clients.map((c) => {
          const profile = c.clientProfile;
          const name = profile ? formatClientDisplayName(profile) : '';
          return {
            id: `${r.id}-${c.id}`,
            clientName: name || '—',
            status: r.status,
            roomName: r.room?.name ?? null,
            bedName: r.bed?.name ?? null,
            startDate: r.startDate ?? null,
          };
        });
      });
  }, [data]);

  return (
    <div>
      <OccupantTable rows={rows} loading={loading} />
    </div>
  );
}
