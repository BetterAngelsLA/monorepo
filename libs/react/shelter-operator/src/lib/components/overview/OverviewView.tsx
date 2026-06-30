import { useQuery } from '@apollo/client/react';
import {
  GetShelterOperatorOverviewDocument,
  type GetShelterOperatorOverviewQuery,
  type GetShelterOperatorOverviewQueryVariables,
} from './__generated__/overview.generated';

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

export function OverviewView({ shelterId }: { shelterId: string }) {
  const { data, error, loading } = useQuery<
    GetShelterOperatorOverviewQuery,
    GetShelterOperatorOverviewQueryVariables
  >(GetShelterOperatorOverviewDocument, {
    variables: { shelterId },
    skip: !shelterId,
    fetchPolicy: 'cache-and-network',
  });

  const shelter = data?.operatorShelter;
  console.log('OverviewView shelter:', shelter);
  const bedCounts = shelter?.bedCounts;
  const roomCounts = shelter?.roomCounts;

  if (loading && !shelter) {
    return (
      <div className="mt-6 px-6 text-sm text-[#6B7280]">Loading overview…</div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 px-6 text-sm text-red-600">
        Something went wrong loading the overview. Please try again.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 px-6 md:grid-cols-1">
      <section className={cardClassName}>
        <h3 className="text-base font-semibold text-[#111827]">
          Shelter Summary
        </h3>
        <div className="mt-3 divide-y divide-[#F3F4F6]">
          <SummaryRow label="Name" value={shelter?.name ?? '-'} />
          <SummaryRow
            label="Organization"
            value={shelter?.organization?.name ?? '-'}
          />
          <SummaryRow label="Address" value={shelter?.location?.place ?? '-'} />
        </div>
      </section>

      <section className={cardClassName}>
        <h3 className="text-base font-semibold text-[#111827]">Bed Summary</h3>
        <div className="mt-3 divide-y divide-[#F3F4F6]">
          <SummaryRow label="Available" value={bedCounts?.available ?? 0} />
          <SummaryRow label="Occupied" value={bedCounts?.occupied ?? 0} />
          <SummaryRow label="Reserved" value={bedCounts?.reserved ?? 0} />
          <SummaryRow
            label="Out of Service"
            value={bedCounts?.outOfService ?? 0}
          />
        </div>
      </section>

      <section className={cardClassName}>
        <h3 className="text-base font-semibold text-[#111827]">Room Summary</h3>
        <div className="mt-3 divide-y divide-[#F3F4F6]">
          <SummaryRow label="Available" value={roomCounts?.available ?? 0} />
          <SummaryRow label="Reserved" value={roomCounts?.reserved ?? 0} />
          <SummaryRow
            label="Out of Service"
            value={roomCounts?.outOfService ?? 0}
          />
        </div>
      </section>
    </div>
  );
}
