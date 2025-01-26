import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceLink } from './shared/ResourceLink';
import { ResourcePortableText } from './shared/ResourcePortableText';
import { ResourceUsefulTipsLink } from './shared/ResourceUsefulTipsLink';

type IProps = {
  className?: string;
  resource: TResource;
};

export function ResourceCard(props: IProps) {
  const { resource, className } = props;

  const { title, shortDescription, usefulTipsLink, resourceLink } = resource;

  const parentCss = [
    'flex',
    'flex-col',
    'border',
    'p-16',
    'rounded-lg',
    'bg-white',
    '[box-shadow:0_4px_6px_#7777771A]',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="font-bold text-[24px]">{title}</div>

      {!!shortDescription && (
        <ResourcePortableText className="mt-8" data={shortDescription} />
      )}

      {!!usefulTipsLink && (
        <ResourceUsefulTipsLink
          title={title}
          className="mt-6"
          href={usefulTipsLink}
        />
      )}

      {!!resourceLink && (
        <ResourceLink
          title={title}
          className="self-end mt-8"
          href={resourceLink}
        />
      )}
    </div>
  );
}
