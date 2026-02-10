export type Shelter = {
  id: string;
  name: string | null;
  address: string | null;
  totalBeds: number | null;
  tags: string[] | null;
};
type Props = { shelter: Shelter };

export function ShelterRow({ shelter }: Props) {
  const { name, address, totalBeds } = shelter;

  return (
    <div className="grid grid-cols-[1fr_1.5fr_0.5fr] items-center px-6 py-4 text-sm border-b border-gray-200 hover:bg-gray-50">
      <div className="font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
        {name ?? 'N/A'}
      </div>

      <div className="text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
        {address ?? 'N/A'}
      </div>

      <div className="text-right whitespace-nowrap text-gray-700">
        {totalBeds ?? 'N/A'}
      </div>
    </div>
  );
}
