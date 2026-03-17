import { PillContainer } from '@monorepo/react/components';
import { ViewShelterQuery } from '../__generated__/shelter.generated';

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

  const FULL_WIDTH_THRESHOLD = 5;

  return (
    <div className="grid grid-cols-3 gap-4">
      {grouped.map(({ category, items }) => (
        <div
          key={category.id}
          className={items.length > FULL_WIDTH_THRESHOLD ? 'col-span-3' : ''}
        >
          <p className="text-xs font-medium text-neutral-40 uppercase tracking-wide mb-1.5">
            {category.displayName}
          </p>
          <PillContainer data={items} />
        </div>
      ))}
    </div>
  );
}
