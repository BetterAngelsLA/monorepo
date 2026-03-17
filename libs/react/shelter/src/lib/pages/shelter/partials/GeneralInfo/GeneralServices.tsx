import { PillContainer } from '@monorepo/react/components';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';

type ServiceEntry = NonNullable<
  ViewShelterQuery['shelter']['services']
>[number];

export function GeneralServices({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const services = shelter.services ?? [];

  if (services.length === 0) return null;

  // Group by category, preserving the server sort order.
  const grouped: { category: ServiceEntry['category']; items: string[] }[] = [];
  let currentCatId: string | null = null;

  for (const svc of services) {
    if (svc.category.id !== currentCatId) {
      currentCatId = svc.category.id;
      grouped.push({ category: svc.category, items: [] });
    }
    grouped[grouped.length - 1].items.push(svc.displayName);
  }

  return (
    <>
      {grouped.map(({ category, items }) => (
        <div key={category.id}>
          <p className="text-base font-semibold">{category.displayName}</p>
          <div className="pb-6">
            <PillContainer maxVisible={5} data={items} />
          </div>
        </div>
      ))}
    </>
  );
}
