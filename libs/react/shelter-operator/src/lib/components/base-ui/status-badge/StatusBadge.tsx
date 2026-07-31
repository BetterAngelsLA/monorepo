import { mergeCss } from '@monorepo/react/shared';

export type StatusBadgeVariant =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'turnaround'
  | 'out-of-service'
  | 'out-of-service-maintenance'
  | 'unknown'
  | 'confirmed'
  | 'checked-in'
  | 'completed'
  | 'cancelled'
  | 'check-in-overdue';

const PALETTE: Record<StatusBadgeVariant, { bg: string; text: string }> = {
  available: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  occupied: { bg: 'bg-sky-100', text: 'text-sky-800' },
  reserved: { bg: 'bg-amber-100', text: 'text-amber-800' },
  turnaround: { bg: 'bg-orange-100', text: 'text-orange-800' },
  'out-of-service': { bg: 'bg-red-100', text: 'text-red-800' },
  'out-of-service-maintenance': {
    bg: 'bg-red-100',
    text: 'text-red-800',
  },
  unknown: { bg: 'bg-gray-100', text: 'text-gray-700' },
  confirmed: { bg: 'bg-sky-100', text: 'text-sky-800' },
  'checked-in': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  'check-in-overdue': { bg: 'bg-amber-100', text: 'text-amber-800' },
};

export function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant?: StatusBadgeVariant;
}) {
  const { bg, text } = PALETTE[variant ?? 'unknown'];

  return (
    <span
      className={mergeCss([
        'inline-flex max-w-full rounded-full px-3 py-1 text-xs font-medium',
        bg,
        text,
      ])}
    >
      {label}
    </span>
  );
}
