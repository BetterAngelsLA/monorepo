import { PortableText, PortableTextBlock } from '@portabletext/react';
import { mergeCss } from '@monorepo/react/shared';

type IProps = {
  className?: string;
  data: PortableTextBlock[] | null;
};

export function ResourcePortableText(props: IProps) {
  const { data, className } = props;

  const parentCss = ['survey-rich-text', className];

  if (!data?.length) {
    return null;
  }

  return (
    <div className={mergeCss(parentCss)}>
      <PortableText value={data} />
    </div>
  );
}
