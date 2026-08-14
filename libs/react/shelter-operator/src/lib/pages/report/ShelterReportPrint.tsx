import type { Ref } from 'react';
import { Text } from '../../components/base-ui/text/text';
import './report.css';
import { ShelterReportData } from './types';

const cardClassName = 'rounded-xl border border-[#E5E7EB] bg-white p-5';

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

        <section className={cardClassName}>
          <h3 className="text-base font-semibold text-[#111827]">
            Shelter Summary
          </h3>
          <div className="mt-3 divide-y divide-[#F3F4F6]">
            <SummaryRow label="Name" value={name} />
            <SummaryRow label="Organization" value={organization?.name ?? '—'} />
            <SummaryRow label="Address" value={location?.place ?? '—'} />
          </div>
        </section>

        <section className={cardClassName}>
          <h3 className="text-base font-semibold text-[#111827]">
            Bed Summary
          </h3>
          <div className="mt-3 divide-y divide-[#F3F4F6]">
            <SummaryRow label="Total" value={bedCounts.total} />
            <SummaryRow label="Available" value={bedCounts.available} />
            <SummaryRow label="Occupied" value={bedCounts.occupied} />
            <SummaryRow label="Reserved" value={bedCounts.reserved} />
            <SummaryRow label="In Turnaround" value={bedCounts.inTurnaround} />
            <SummaryRow label="Out of Service" value={bedCounts.outOfService} />
          </div>
        </section>

        <section className={cardClassName}>
          <h3 className="text-base font-semibold text-[#111827]">
            Room Summary
          </h3>
          <div className="mt-3 divide-y divide-[#F3F4F6]">
            <SummaryRow label="Total" value={roomCounts.total} />
            <SummaryRow label="Available" value={roomCounts.available} />
            <SummaryRow label="Occupied" value={roomCounts.occupied} />
            <SummaryRow label="Reserved" value={roomCounts.reserved} />
            <SummaryRow label="In Turnaround" value={roomCounts.inTurnaround} />
            <SummaryRow label="Out of Service" value={roomCounts.outOfService} />
          </div>
        </section>
      </div>
    </div>
  );
}
