import { PortableText, PortableTextBlock } from '@portabletext/react';
import { mergeCss } from '../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  data: PortableTextBlock;
};
// | PortableTextObject;

export function ResourcePortableText(props: IProps) {
  const { data, className } = props;

  const parentCss = ['flex', className];

  return (
    <div className={mergeCss(parentCss)}>
      <PortableText value={data} />
    </div>
  );
}
