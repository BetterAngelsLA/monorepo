import {
  ResourceTagCategoryEnum,
  tagsByCategory,
} from '../../../pages/introduction/firesSurvey/constants.survey';
import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceGroupCard } from './ResourceGroupCard';

type IProps = {
  className?: string;
  resources: TResource[];
};

export function SurveyResources(props: IProps) {
  const { resources, className } = props;

  const parentCss = [className];
  const groupedResources = groupResourcesByCategory(resources);

  return (
    <div className={mergeCss(parentCss)}>
      <div className="mt-12 md:mt-20 mb-8 md:mb-12 font-bold text-xl md:text-2xl">
        Resources
      </div>

      {Object.keys(groupedResources).map((categoryKey) => {
        const categoryEnum = categoryKey as ResourceTagCategoryEnum;
        const resources = groupedResources[categoryEnum];

        return (
          <ResourceGroupCard
            key={categoryKey}
            className="mb-12 md:mb-20 last:mb-0"
            resourceCategory={categoryEnum}
            resources={resources}
          />
        );
      })}
    </div>
  );
}

export function groupResourcesByCategory(
  resources: TResource[]
): Partial<Record<ResourceTagCategoryEnum, TResource[]>> {
  const grouped: Partial<Record<ResourceTagCategoryEnum, TResource[]>> = {};

  resources.forEach((resource) => {
    if (resource.tags) {
      for (const tag of resource.tags) {
        for (const category of Object.keys(ResourceTagCategoryEnum)) {
          const categoryEnum =
            ResourceTagCategoryEnum[
              category as keyof typeof ResourceTagCategoryEnum
            ];

          if (tagsByCategory[categoryEnum].includes(tag)) {
            if (!grouped[categoryEnum]) {
              grouped[categoryEnum] = [];
            }
            grouped[categoryEnum]!.push(resource);

            return;
          }
        }
      }
    }
  });

  for (const category in grouped) {
    if (grouped[category as keyof typeof grouped]?.length === 0) {
      delete grouped[category as keyof typeof grouped];
    }
  }

  return grouped;
}
