import { FC } from 'react';
import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceLink } from './shared/ResourceLink';
import { ResourcePortableText } from './shared/ResourcePortableText';
import { ResourceTipsDescription } from './shared/ResourceTipsDescription';

type IProps = {
  className?: string;
  resource: TResource;
  // icon?: React.ReactNode;
  Icon: FC<{ className?: string }>;
};

export function ResourceCard(props: IProps) {
  const { Icon, resource, className } = props;

  const { title, shortDescription, tipsDescription, resourceLink } = resource;

  const parentCss = [
    'flex',
    'flex-col',
    'border',
    'p-6',
    'rounded-lg',
    'bg-white',
    '[box-shadow:0_4px_6px_#7777771A]',
    'break-inside-avoid',
    className,
  ];
  return (
    <div className={mergeCss(parentCss)}>
      <div className="font-bold text-[24px]">{title}</div>

      {!!shortDescription && (
        <div className="flex flex-row items-center mt-8">
          <div className="h-[24px] w-[24px]"></div>
          {!!Icon && (
            <Icon className="h-[40px] w-[40px] lg:h-[60px] lg:w-[60px] text-brand-dark-blue" />
          )}
          <ResourcePortableText className="mt-8" data={shortDescription} />
        </div>
      )}

      {!!tipsDescription && <ResourceTipsDescription data={tipsDescription} />}

      {!!resourceLink && (
        <ResourceLink
          title={title}
          className="ml-auto mt-8"
          href={resourceLink}
        />
      )}
    </div>
  );
}
