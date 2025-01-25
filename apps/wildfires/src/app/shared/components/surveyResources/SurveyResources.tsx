import { groupBy, sortBy, uniqueBy } from 'remeda';
import { TResource, TTagCategory } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceGroupCard } from './ResourceGroupCard';
type IProps = {
  className?: string;
  resources: TResource[];
};

export function SurveyResources(props: IProps) {
  const { resources, className } = props;

  const parentCss = [className];

  const groupedAndSortedResources = groupResources(resources);

  return (
    <div className={mergeCss(parentCss)}>
      <div className="mt-12 md:mt-20 mb-8 md:mb-12 font-bold text-xl md:text-2xl">
        Resources
      </div>

      {groupedAndSortedResources.map((categoryResources) => {
        const { category, resources } = categoryResources;

        return (
          <ResourceGroupCard
            key={category.slug}
            className="mb-12 md:mb-20 last:mb-0"
            resourceCategory={category.name}
            resources={resources}
          />
        );
      })}
    </div>
  );
}

type TCategoryResources = {
  category: TTagCategory;
  resources: TResource[];
};

export function groupResources(resources: TResource[]): TCategoryResources[] {
  const resourcesWithCategories = resources.flatMap((resource) =>
    (resource.tags || []).map((tag) => ({
      category: tag.category,
      resource,
    }))
  );

  const validResources = resourcesWithCategories.filter(
    (entry) => entry.category !== undefined
  );

  const grouped = groupBy(validResources, (entry) => entry.category?.slug);

  const categoryResources: TCategoryResources[] = Object.entries(grouped).map(
    ([slug, entries]) => ({
      category: entries[0].category ?? { name: 'Unknown', slug: slug },
      resources: uniqueBy(
        entries.map((entry) => entry.resource),
        (r) => r.slug
      ),
    })
  );

  return sortBy(categoryResources, (cr) => cr.category.priority ?? -Infinity);
}
