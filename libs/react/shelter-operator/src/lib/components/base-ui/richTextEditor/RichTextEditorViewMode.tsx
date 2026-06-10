import { mergeCss, sanitizeHtml } from '@monorepo/react/shared';
import { Label } from '../label';

const RICH_TEXT_SANITIZE_OPTIONS = {
  allowedTags: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a', 'blockquote'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
};

const viewContentCss = [
  'prose',
  'prose-sm',
  'max-w-none',
  'pl-5',
  'text-sm',
  'text-gray-900',
  '[&_blockquote]:border-l-4',
  '[&_blockquote]:border-gray-300',
  '[&_blockquote]:pl-4',
  '[&_blockquote]:italic',
  '[&_blockquote]:text-gray-500',
];

type TProps = {
  value: string;
  label?: string;
  required?: boolean;
  className?: string;
};

export function RichTextEditorViewMode({
  value,
  label,
  required,
  className,
}: TProps) {
  return (
    <div className={mergeCss(['flex flex-col gap-1 font-sans', className])}>
      {label && (
        <Label
          label={label}
          variant="offset"
          required={required}
          className="mb-3"
        />
      )}
      <div
        className={mergeCss(viewContentCss)}
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(value, RICH_TEXT_SANITIZE_OPTIONS),
        }}
      />
    </div>
  );
}
