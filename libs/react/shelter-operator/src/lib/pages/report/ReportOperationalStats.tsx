import { mergeCss } from '@monorepo/react/shared';
import type { ReservationMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { Text } from '../../components/base-ui/text/text';

interface IStatCard {
  key: string;
  label: string;
  value: string;
  subRow?: { label: string; value: string };
}

export interface IReportOperationalStatsProps {
  showReservationStatusChanges: boolean;
  showAvgDaysToOccupancy: boolean;
  metrics?: ReservationMetrics | null;
  avgDaysToOccupancy?: number | null;
}

const cardLabelClass = 'text-[13px] text-[#747A82]';
const cardValueClass = 'text-[22px] leading-none text-black';

function StatCard({
  card,
  roundedSide,
}: {
  card: IStatCard;
  /** Which side gets the outer 12px radius when merged into a pill; 'both' when standalone. */
  roundedSide: 'left' | 'right' | 'both' | 'none';
}) {
  return (
    <div
      className={mergeCss([
        'flex flex-1 flex-col gap-2 bg-white p-2.5',
        {
          left: 'rounded-l-xl rounded-r-[2px]',
          right: 'rounded-r-xl rounded-l-[2px]',
          both: 'rounded-xl',
          none: 'rounded-[2px]',
        }[roundedSide],
      ])}
    >
      <Text variant="body" className={cardLabelClass}>
        {card.label}
      </Text>
      <Text variant="header-lg" className={cardValueClass}>
        {card.value}
      </Text>
      {card.subRow && (
        <div className="flex items-center justify-between">
          <Text
            variant="body"
            className="whitespace-nowrap text-[12px] text-[#747A82]"
          >
            {card.subRow.label}
          </Text>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#F3F3F9] px-3 py-0.5 text-[12px] text-[#383B40]">
            {card.subRow.value}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Operational stats for the PDF export, matching the Figma's grouped-pill
 * treatment — distinct from the live dashboard's separate shadowed
 * StatCards (ReservationStatusChanges). The three reservation-status cards
 * merge into one white pill (touching, only the outer corners rounded)
 * inside a light grey tray; "Avg. days to occupancy" sits beside it as its
 * own rounded card, separated by a divider. When it's the only metric
 * included, it instead renders as a flat label/value row.
 */
export function ReportOperationalStats({
  showReservationStatusChanges,
  showAvgDaysToOccupancy,
  metrics,
  avgDaysToOccupancy,
}: IReportOperationalStatsProps) {
  const reservationCards: IStatCard[] = showReservationStatusChanges
    ? [
        {
          key: 'checked-in',
          label: 'Newly Checked In',
          value: metrics?.checkedIn != null ? String(metrics.checkedIn) : '—',
          subRow: metrics
            ? {
                label: 'Previously Overdue',
                value:
                  metrics.checkedIn > 0
                    ? `${metrics.checkInOverdueToCheckedIn} / ${metrics.checkedIn}`
                    : '—',
              }
            : undefined,
        },
        {
          key: 'canceled',
          label: 'Newly Canceled',
          value: metrics?.cancelled != null ? String(metrics.cancelled) : '—',
        },
        {
          key: 'overdue',
          label: 'Newly Overdue',
          value:
            metrics?.checkInOverdue != null
              ? String(metrics.checkInOverdue)
              : '—',
        },
      ]
    : [];

  const avgDaysCard: IStatCard | undefined = showAvgDaysToOccupancy
    ? {
        key: 'avg-days',
        label: 'Avg. days to occupancy',
        value: avgDaysToOccupancy != null ? String(avgDaysToOccupancy) : '—',
      }
    : undefined;

  if (reservationCards.length === 0 && !avgDaysCard) return null;

  // Only metric included: a flat label/value row, still in the grey tray so
  // it matches the other cards' chrome instead of a plain bordered box.
  if (reservationCards.length === 0 && avgDaysCard) {
    return (
      <div className="rounded-2xl bg-[#F9F9F9] p-1">
        <div className="flex items-center justify-between rounded-xl bg-white px-6 py-4">
          <Text variant="body" textColor="text-[#6B7280]">
            {avgDaysCard.label}
          </Text>
          <Text
            variant="header-lg"
            textColor="text-black"
            className="text-[22px]"
          >
            {avgDaysCard.value}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-2 rounded-2xl bg-[#F9F9F9] p-1">
      {/* Weighted 3:1 against the single avg-days card below so each of the
          three reservation cards ends up roughly the same width as it, not
          squeezed to a third of a half-width group. A small gap between them
          lets the grey tray show through as a thin divider, matching the
          Figma rather than one seamless touching pill. */}
      <div className="flex flex-[3] items-stretch gap-1">
        {reservationCards.map((card, index) => (
          <StatCard
            key={card.key}
            card={card}
            roundedSide={
              index === 0
                ? 'left'
                : index === reservationCards.length - 1
                  ? 'right'
                  : 'none'
            }
          />
        ))}
      </div>

      {avgDaysCard && (
        <>
          <div className="my-2 w-px shrink-0 self-stretch rounded-full bg-[#D0CFCF]" />
          <div className="flex flex-1 items-stretch">
            <StatCard card={avgDaysCard} roundedSide="both" />
          </div>
        </>
      )}
    </div>
  );
}
