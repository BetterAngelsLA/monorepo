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

  const splitIndex = Math.ceil(grouped.length / 2);
  const columns = [grouped.slice(0, splitIndex), grouped.slice(splitIndex)];

  function renderSection({
    category,
    items,
  }: {
    category: ServiceEntry['category'];
    items: string[];
  }) {
    return (
      <section
        key={category.id}
        className="border-t border-neutral-90 pt-4 first:border-t-0 first:pt-0"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-primary-20">
            {category.displayName}
          </h4>
          <span className="text-xs font-medium text-neutral-50">
            {items.length} {items.length === 1 ? 'service' : 'services'}
          </span>
        </div>

        <PillContainer data={items} />
      </section>
    );
  }

  return (
    <>
      <div className="space-y-5 md:hidden">{grouped.map(renderSection)}</div>

      <div className="hidden md:grid md:grid-cols-2 md:gap-x-8">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-5">
            {column.map(renderSection)}
          </div>
        ))}
      </div>
    </>
  );
}
