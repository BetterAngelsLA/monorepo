import { formatClientDisplayName } from '@monorepo/react/shared';
import { useMemo } from 'react';
import { ReservationStatusChoices } from '../../apollo/graphql/__generated__/types';
import { useReservations } from '../../hooks/useReservations';
import type { GetReservationsQuery } from '../../hooks/useReservations/__generated__/useReservations.generated';
import { OccupantTable, type OccupantRow } from './OccupantTable';

const ACTIVE_STATUSES: Set<ReservationStatusChoices> = new Set([
  ReservationStatusChoices.Confirmed,
  ReservationStatusChoices.CheckedIn,
  ReservationStatusChoices.CheckInOverdue,
]);

type ReservationResult = NonNullable<
  GetReservationsQuery['reservations']['results'][number]
>;

export function OccupantsView({ shelterId }: { shelterId: string }) {
  const { reservations, loading } = useReservations(shelterId);

  const rows: OccupantRow[] = useMemo(() => {
    const results: ReservationResult[] = reservations;
    return results
      .filter((r) => ACTIVE_STATUSES.has(r.status))
      .flatMap((r) =>
        r.clients.map((c) => {
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
        })
      );
  }, [reservations]);

  return <OccupantTable rows={rows} loading={loading} />;
}
