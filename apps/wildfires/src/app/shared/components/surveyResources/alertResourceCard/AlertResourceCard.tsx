import { IdeaBulbIcon } from '@monorepo/react/icons';
import { TResource } from '../../../clients/sanityCms/types';
import { mergeCss } from '../../../utils/styles/mergeCss';
import { CalloutBlock } from '../shared/CalloutBlock';
import { ResourceLink } from '../shared/ResourceLink';
import { ResourcePortableText } from '../shared/ResourcePortableText';

type IProps = {
  className?: string;
  resource: TResource;
};

export function AlertResourceCard(props: IProps) {
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

      {/* <IdeaBulbIcon /> */}

      <CalloutBlock icon={<IdeaBulbIcon className="h-6" />}>
        {!!shortDescription && (
          <ResourcePortableText className="" data={shortDescription} />
        )}
      </CalloutBlock>

      {!!shortDescription && (
        <ResourcePortableText className="mt-8" data={shortDescription} />
      )}

      {/* {!!description && <ResourcePortableText data={description} />} */}
      {!!description && (
        <div>
          <ResourcePortableText data={description} />
        </div>
      )}

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
