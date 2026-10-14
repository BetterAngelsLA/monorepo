import { ReservationStatusChoices } from '@monorepo/ba-platform/types';
import { formatClientDisplayName } from '@monorepo/react/shared';
import { useMemo } from 'react';
import { useReservations } from '../../../../hooks';
import type { ReservationsQuery } from '../../../../hooks/useReservations/__generated__/useReservations.generated';
import { OccupantTable, type OccupantRow } from './OccupantTable';

const ACTIVE_STATUSES: Set<ReservationStatusChoices> = new Set([
  ReservationStatusChoices.Confirmed,
  ReservationStatusChoices.CheckedIn,
  ReservationStatusChoices.CheckInOverdue,
]);

type ReservationResult = NonNullable<
  ReservationsQuery['reservations']['results'][number]
>;

export function Occupants({ shelterId }: { shelterId: string }) {
  const { reservations, loading } = useReservations(shelterId);

  const occupants: OccupantRow[] = useMemo(() => {
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
            checkedInAt: r.checkedInAt ?? null,
            startDate: r.startDate ?? null,
          };
        }),
      );
  }, [reservations]);

  return <OccupantTable occupants={occupants} loading={loading} />;
}
