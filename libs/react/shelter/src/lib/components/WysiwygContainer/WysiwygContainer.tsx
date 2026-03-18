import { mergeCss, sanitizeHtml } from '@monorepo/react/shared';
import styles from './wysiwyg.module.css';

type TProps = {
  content?: string | null;
  className?: string;
};

export function WysiwygContainer(props: TProps) {
  const { content, className } = props;

  const sanitizedContent = sanitizeHtml(content);

  if (!sanitizedContent.length) {
    return null;
  }

  const parentCss = [styles.wysiwyg, className];

  return (
    <div
      className={mergeCss(parentCss)}
      dangerouslySetInnerHTML={{
        __html: sanitizedContent,
      }}
    />
  );
}
