import { PortableText, PortableTextBlock } from '@portabletext/react';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  data: PortableTextBlock;
};

export function ResourcePortableText(props: IProps) {
  const { data, className } = props;

  const parentCss = ['survey-rich-text', className];

  return (
    <div className={mergeCss(parentCss)}>
      <PortableText value={data} />
    </div>
  );
}
