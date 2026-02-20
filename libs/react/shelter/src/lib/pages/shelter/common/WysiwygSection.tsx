import { mergeCss } from '@monorepo/react/shared';
import { WysiwygContainer } from '../../../components';

type TProps = {
  content?: string | null;
  title?: string;
  titleClassName?: string;
  className?: string;
  contentClassName?: string;
};

export function WysiwygSection(props: TProps) {
  const { title, content, className, titleClassName, contentClassName } = props;

  if (!content?.length) {
    return null;
  }

  const titleCss = ['font-semibold', 'mb-2', titleClassName];

  return (
    <div className={className}>
      {!!title && <div className={mergeCss(titleCss)}>{title}</div>}

      <WysiwygContainer content={content} className={contentClassName} />
    </div>
  );
}
