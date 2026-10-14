import type { ReactNode, Ref } from 'react';
import { Text } from '../../components/base-ui/text/text';
import './report.css';
import { ShelterReportData } from './types';

const cardClassName = 'rounded-xl border border-[#E5E7EB] bg-white p-5';

/** Bed and room counts share a shape, so both render the same rows. */
const COUNT_ROWS = [
  { key: 'total', label: 'Total' },
  { key: 'available', label: 'Available' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'inTurnaround', label: 'In Turnaround' },
  { key: 'outOfService', label: 'Out of Service' },
] as const;

type Counts = Record<(typeof COUNT_ROWS)[number]['key'], number>;

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-medium text-[#111827]">{value}</span>
    </div>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={cardClassName}>
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <div className="mt-3 divide-y divide-[#F3F4F6]">{children}</div>
    </section>
  );
}

function CountsSection({ title, counts }: { title: string; counts: Counts }) {
  return (
    <SummarySection title={title}>
      {COUNT_ROWS.map(({ key, label }) => (
        <SummaryRow key={key} label={label} value={counts[key]} />
      ))}
    </SummarySection>
  );
}

export function ShelterReportPrint({
  data,
  ref,
}: {
  data: ShelterReportData;
  ref?: Ref<HTMLDivElement>;
}) {
  const { name, organization, location, bedCounts, roomCounts } = data;

  return (
    <div ref={ref} className="shelter-report-print">
      <div className="grid gap-4 p-6">
        <header>
          <Text variant="header-md">{name}</Text>
        </header>

        <SummarySection title="Shelter Summary">
          <SummaryRow label="Name" value={name} />
          <SummaryRow label="Organization" value={organization?.name ?? '—'} />
          <SummaryRow label="Address" value={location?.place ?? '—'} />
        </SummarySection>

        <CountsSection title="Bed Summary" counts={bedCounts} />
        <CountsSection title="Room Summary" counts={roomCounts} />
      </div>
    </div>
  );
}
