import { forwardRef } from 'react';
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

export const ShelterReportPrint = forwardRef<
  HTMLDivElement,
  { data: ShelterReportData }
>(function ShelterReportPrint({ data }, ref) {
  const { name, organization, location, bedsByStatus, roomsByStatus } = data;

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
            <SummaryRow label="Organization" value={organization.name} />
            <SummaryRow label="Address" value={location.place} />
          </div>
        </section>

        <section className={cardClassName}>
          <h3 className="text-base font-semibold text-[#111827]">
            Bed Summary
          </h3>
          <div className="mt-3 divide-y divide-[#F3F4F6]">
            <SummaryRow label="Available" value={bedsByStatus.available} />
            <SummaryRow label="Occupied" value={bedsByStatus.occupied} />
            <SummaryRow label="Reserved" value={bedsByStatus.reserved} />
            <SummaryRow
              label="Out of Service"
              value={bedsByStatus.outOfService}
            />
          </div>
        </section>

        <section className={cardClassName}>
          <h3 className="text-base font-semibold text-[#111827]">
            Room Summary
          </h3>
          <div className="mt-3 divide-y divide-[#F3F4F6]">
            <SummaryRow label="Available" value={roomsByStatus.available} />
            <SummaryRow label="Reserved" value={roomsByStatus.reserved} />
            <SummaryRow
              label="Needs Maintenance"
              value={roomsByStatus.needsMaintenance}
            />
          </div>
        </section>
      </div>
    </div>
  );
});
