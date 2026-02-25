import { mergeCss } from '@monorepo/react/shared';
import styles from './wysiwyg.module.css';

type TProps = {
  content?: string | null;
  className?: string;
};

export function WysiwygContainer(props: TProps) {
  const { content, className } = props;

  if (!content?.length) {
    return null;
  }

  const parentCss = [styles.wysiwyg, className];

  return (
    <div
      className={mergeCss(parentCss)}
      dangerouslySetInnerHTML={{
        __html: content,
      }}
    />
  );
}
