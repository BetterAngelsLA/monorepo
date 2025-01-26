import { groupBy, sortBy, uniqueBy } from 'remeda';
import { TResource, TTagCategory } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { AlertResources } from './AlertResources';
import { ResourceGroupCard } from './ResourceGroupCard';
type IProps = {
  className?: string;
  resources: TResource[];
};

export function SurveyResources(props: IProps) {
  const { resources, className } = props;

  const parentCss = [className];

  const baseResources = resources.filter((r) => r.resourceType === 'resource');
  const alertResources = resources.filter((r) => r.resourceType === 'alert');

  const baseResourcesGroupedSorted = groupResources(baseResources);

  return (
    <div className={mergeCss(parentCss)}>
      <div className="mt-12 md:mt-20 mb-8 md:mb-12 font-bold text-xl md:text-2xl">
        Resources
      </div>

      {!!baseResourcesGroupedSorted.length && (
        <div>
          {baseResourcesGroupedSorted.map((categoryResources) => {
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
      )}

      {!!alertResources.length && (
        <div className="mt-12 md:mt-16">
          <AlertResources
            className="mb-12 md:mb-20 last:mb-0"
            alerts={alertResources}
          />
        </div>
      )}
    </div>
  );
}

type TCategoryResources = {
  category: TTagCategory;
  resources: TResource[];
};

export function groupResources(resources: TResource[]): TCategoryResources[] {
  const resourcesWithCategories = resources.flatMap((resource) =>
    (resource.tags || []).flatMap((tag) =>
      tag.category ? [{ category: tag.category, resource }] : []
    )
  );

  const grouped = groupBy(
    resourcesWithCategories,
    (entry) => entry.category.slug
  );

  const categoryResources: TCategoryResources[] = Object.entries(grouped).map(
    ([slug, entries]) => ({
      category: entries[0].category,
      resources: uniqueBy(
        entries.map((entry) => entry.resource),
        (r) => r.slug
      ),
    })
  );

  return sortBy(categoryResources, (cr) => cr.category.priority ?? -Infinity);
}
