import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceLink } from './shared/ResourceLink';
import { ResourcePortableText } from './shared/ResourcePortableText';
import { ResourceTipsDescription } from './shared/ResourceTipsDescription';

type IProps = {
  className?: string;
  resource: TResource;
};

export function ResourceCard(props: IProps) {
  const { resource, className } = props;

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
        <ResourcePortableText className="mt-8" data={shortDescription} />
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
