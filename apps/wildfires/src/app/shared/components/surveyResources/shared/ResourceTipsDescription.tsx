import { LightBulbIcon } from '@monorepo/react/icons';
import { PortableText } from '@portabletext/react';
import { PortableTextBlock } from '@portabletext/types';
import { mergeCss } from '../../../utils/styles/mergeCss';
import { ResourceCallout } from './ResourceCallout';

type IProps = {
  className?: string;
  data: PortableTextBlock;
  expanded?: boolean;
};

export function ResourceTipsDescription(props: IProps) {
  const { data, expanded, className } = props;

  const parentCss = ['wisiwig', className];

  return (
    <ResourceCallout
      className={mergeCss(parentCss)}
      icon={<LightBulbIcon className="h-6 md:h-8" />}
      expanded={expanded}
    >
      <PortableText value={data} />
    </ResourceCallout>
  );
}
