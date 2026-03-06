import type { Shelter } from '../types/shelter';

type Props = { shelter: Shelter };

export function ShelterRow({ shelter }: Props) {
  const { name, address, totalBeds, occupiedBeds, tags } = shelter;

  const hasCapacity = typeof totalBeds === 'number' && totalBeds > 0;
  const usedBeds = hasCapacity
    ? Math.min(Math.max(occupiedBeds ?? totalBeds ?? 0, 0), totalBeds)
    : null;
  const progressPct =
    hasCapacity && usedBeds !== null ? (usedBeds / totalBeds) * 100 : 0;

  return (
    <div
      className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr] items-center px-6 py-4 text-sm border-b border-gray-200 hover:bg-gray-50"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <div className="font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
        {name ?? 'N/A'}
      </div>

      <div className="text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
        {address ?? 'N/A'}
      </div>

      <div className="flex justify-start whitespace-nowrap text-gray-700 text-left">
        {hasCapacity && usedBeds !== null ? (
          <div className="flex items-center gap-3">
            <div className="h-4 w-[150px] overflow-hidden rounded-full border border-slate-300 bg-slate-200">
              <div
                className="h-full rounded-full bg-[#FFC5BF] transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="leading-5 text-slate-700">
              {usedBeds} / {totalBeds} beds
            </span>
          </div>
        ) : (
          <div className="whitespace-nowrap">N/A</div>
        )}
      </div>

      <div className="text-right text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
        {tags?.length ? tags.join(', ') : 'N/A'}
      </div>
    </div>
  );
}
