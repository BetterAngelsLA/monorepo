import { FC } from 'react';
import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceLink } from './shared/ResourceLink';
import { ResourcePortableText } from './shared/ResourcePortableText';
import { ResourceTipsDescription } from './shared/ResourceTipsDescription';

type IProps = {
  className?: string;
  resource: TResource;
  Icon?: FC<{ className?: string }>;
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
    'mb-1',
    className,
  ];
  return (
    <div className={mergeCss(parentCss)}>
      <div className="flex flex-row items-center">
        {!!Icon && (
          <div className="mr-6">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="font-bold text-[24px]">{title}</div>
      </div>
      {!!shortDescription && (
        <ResourcePortableText className="mt-4" data={shortDescription} />
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
