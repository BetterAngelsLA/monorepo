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
  const groupedResources: Record<string, TResource[]> = {};
  const categories: TTagCategory[] = [];

  resources.forEach((resource) => {
    resource.tags?.forEach((tag) => {
      const category = tag.category;

      if (category) {
        if (!groupedResources[category.slug]) {
          groupedResources[category.slug] = [];

          categories.push(category);
        }

        groupedResources[category.slug].push(resource);
      }
    });
  });

  const grouped: TCategoryResources[] = Object.keys(groupedResources).map(
    (categorySlug) => {
      return {
        category: categories.find(
          (c) => c.slug === categorySlug
        ) as TTagCategory,
        resources: groupedResources[categorySlug],
      };
    }
  );

  return sortCategoryResourcesByPriority(grouped);
}

export function sortCategoryResourcesByPriority(
  categoryResources: TCategoryResources[]
): TCategoryResources[] {
  return categoryResources.sort((a, b) => {
    // Handle undefined or null priority by treating them as the lowest possible priority
    const priorityA = a.category.priority ?? -Infinity;
    const priorityB = b.category.priority ?? -Infinity;

    // Compare priorities: lower number first
    if (priorityA < priorityB) return -1;
    if (priorityA > priorityB) return 1;

    return 0;
  });
}
