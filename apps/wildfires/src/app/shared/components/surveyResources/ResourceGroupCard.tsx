import { TResource } from '../../clients/sanityCms/types';
import { sortByPriority } from '../../utils/sort';
import { mergeCss } from '../../utils/styles/mergeCss';
import { SectionBanner } from '../banners/SectionBanner';
import { ResourceCard } from './ResourceCard';

type IProps = {
  className?: string;
  resourceCategory: string;
  resources?: TResource[];
};

export function ResourceGroupCard(props: IProps) {
  const { resourceCategory, resources, className } = props;

  const parentCss = ['flex', 'flex-col', className];

  if (!resources?.length) {
    return null;
  }

  const sortedResources = sortByPriority<TResource>(resources, 'priority');

  const title = resourceCategory;

  return (
    <div className={mergeCss(parentCss)}>
      {!!title && (
        <SectionBanner
          className="mb-4 md:mb-12 break-after-avoid-page"
          title={title}
          variant="med"
        />
      )}

      {sortedResources.map((resource, index) => (
        <ResourceCard
          key={index}
          className="mb-4 lg:mb-10 last:mb-0"
          resource={resource}
        />
      ))}
    </div>
  );
}
