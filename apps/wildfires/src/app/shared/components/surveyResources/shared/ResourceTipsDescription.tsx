import { LightBulbIcon } from '@monorepo/react/icons';
import { PortableText } from '@portabletext/react';
import { PortableTextBlock } from '@portabletext/types';
import { mergeCss } from '@monorepo/react/shared';
import { ResourceCallout } from './ResourceCallout';

type IProps = {
  className?: string;
  data: PortableTextBlock[] | null;
};

export function ResourceTipsDescription(props: IProps) {
  const { data, className } = props;

  const parentCss = ['wisiwig', className];

  if (!data?.length) {
    return null;
  }

  return (
    <ResourceCallout
      className={mergeCss(parentCss)}
      icon={<LightBulbIcon className="h-6 md:h-8" />}
    >
      <PortableText value={data} />
    </ResourceCallout>
  );
}
