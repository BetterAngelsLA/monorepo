import { WFAlertOnIcon } from '@monorepo/react/icons';
import { TResource } from '../../clients/sanityCms/types';
import { sortByPriority } from '../../utils/sort';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceCard } from './ResourceCard';

type IProps = {
  className?: string;
  alerts?: TResource[];
};

export function AlertResources(props: IProps) {
  const { alerts, className } = props;

  const parentCss = [
    'flex',
    'flex-col',
    'bg-[#FFFEE0]', // TODO: get named color
    'px-4',
    'py-[52px]',
    'rounded-xl',
    className,
  ];

  if (!alerts?.length) {
    return null;
  }

  const sortedAlerts = sortByPriority<TResource>(alerts, 'priority');

  return (
    <div className={mergeCss(parentCss)}>
      <div className="uppercase text-lg font-bold mb-10 lg:mb-[60px]">
        important tips
      </div>

      {sortedAlerts.map((alert) => (
        <ResourceCard
          key={alert.slug}
          Icon={WFAlertOnIcon}
          className="mb-4 lg:mb-10 last:mb-0"
          resource={alert}
        />
      ))}
    </div>
  );
}
