import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ResourceLink } from './ResourceLink';
import { ResourcePortableText } from './ResourcePortableText';

type IProps = {
  className?: string;
  resource: TResource;
};

export function ResourceCard(props: IProps) {
  const { resource, className } = props;

  const { title, description, shortDescription, resourceType, resourceLink } =
    resource;

  const parentCss = [
    'flex',
    'flex-col',
    'border',
    'p-6',
    'rounded-lg',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="font-bold text-[24px]">{title}</div>

      {!!shortDescription && (
        <ResourcePortableText className="mt-8" data={shortDescription} />
      )}

      {!!description && <ResourcePortableText data={description} />}

      {!!resourceLink && (
        <ResourceLink
          className="self-end mt-8"
          href={resourceLink}
          external={true}
        />
      )}
    </div>
  );
}
