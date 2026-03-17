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

  return (
    <div className="space-y-3">
      {grouped.map(({ category, items }) => (
        <section
          key={category.id}
          className="rounded-2xl border border-neutral-90 bg-neutral-99 px-4 py-3"
        >
          <p className="mb-3 text-sm font-semibold text-primary-20">
            {category.displayName}
          </p>
          <PillContainer data={items} />
        </section>
      ))}
    </div>
  );
}
