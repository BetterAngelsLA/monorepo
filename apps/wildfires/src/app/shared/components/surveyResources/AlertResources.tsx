// AlertResources.tsx

import { TResource } from '../../clients/sanityCms/types';
import { sortByPriority } from '../../utils/sort';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceCard } from './ResourceCard';

type IProps = {
  className?: string;
  resources?: TResource[];
};

export function AlertResources(props: IProps) {
  const { resources, className } = props;

  const parentCss = [
    'flex',
    'flex-col',
    'bg-[#FFFEE0]',
    'px-4',
    'py-[52px]',
    'rounded-xl',
    className,
  ];

  if (!resources?.length) {
    return null;
  }

  const sortedResources = sortByPriority<TResource>(resources, 'priority');

  return (
    <div className={mergeCss(parentCss)}>
      <div className="uppercase text-lg font-bold mb-10 lg:mb-[60px]">
        alerts
      </div>

      {sortedResources.map((resource) => (
        <ResourceCard
          key={resource.slug}
          className="mb-4 lg:mb-10 last:mb-0"
          resource={resource}
        />
      ))}
    </div>
  );
}
