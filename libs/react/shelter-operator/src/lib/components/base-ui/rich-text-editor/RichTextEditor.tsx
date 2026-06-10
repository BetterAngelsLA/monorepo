import { mergeCss, sanitizeHtml } from '@monorepo/react/shared';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AlertCircle } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Label } from '../label';
import { Text } from '../text/text';
import {
  DEFAULT_TOOLBAR_BUTTONS,
  RichTextEditorToolbar,
  type ToolbarButtonKey,
} from './RichTextEditorToolbar';

const RICH_TEXT_SANITIZE_OPTIONS = {
  allowedTags: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
};

/** Tiptap returns `<p></p>` for an empty editor. Treat that as empty. */
function htmlToFormValue(html: string): string {
  const isEmpty = html === '<p></p>' || html.trim() === '';
  return isEmpty ? '' : html;
}

type TProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  isViewMode?: boolean;
  placeholder?: string;
  buttons?: ToolbarButtonKey[];
  className?: string;
};

export function RichTextEditor(props: TProps) {
  const {
    value,
    onChange,
    onBlur,
    label,
    error,
    required = false,
    disabled = false,
    isViewMode = false,
    placeholder = '',
    buttons = DEFAULT_TOOLBAR_BUTTONS,
    className,
  } = props;

  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const generatedId = useId();
  const messageId = `${generatedId}-message`;

  const shouldShowError = Boolean(error) && isTouched && !isFocused;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editable: !disabled && !isViewMode,
    onUpdate: ({ editor }) => {
      onChange(htmlToFormValue(editor.getHTML()));
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      setIsTouched(true);
      onBlur?.();
    },
  });

  // Sync external value changes (e.g. async defaultValues load or reset())
  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = htmlToFormValue(editor.getHTML());

    if (current !== value) {
      editor.commands.setContent(value ?? '', { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled && !isViewMode);
  }, [editor, disabled, isViewMode]);

  const isViewEditMode = typeof isViewMode === 'boolean';

  if (isViewMode) {
    return (
      <div className={mergeCss(['flex flex-col gap-1 font-sans', className])}>
        {label && (
          <Label
            label={label}
            variant={isViewEditMode ? 'offset' : undefined}
            required={required}
            className="mb-3"
          />
        )}
        <div
          className="prose prose-sm max-w-none pl-5 text-sm text-gray-900"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(value, RICH_TEXT_SANITIZE_OPTIONS),
          }}
        />
      </div>
    );
  }

  const contentCss = [
    'px-5',
    'py-3',
    'text-sm',
    'text-gray-900',
    '[&_.tiptap]:min-h-[5rem]',
    '[&_.tiptap]:outline-none',
    '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
    '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
    '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
    '[&_.tiptap_p.is-editor-empty:first-child::before]:text-gray-400',
    '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
    '[&_.tiptap_ul]:list-disc',
    '[&_.tiptap_ul]:pl-5',
    '[&_.tiptap_ol]:list-decimal',
    '[&_.tiptap_ol]:pl-5',
  ];

  return (
    <div className={mergeCss(['flex flex-col gap-1 font-sans', className])}>
      {label && (
        <Label
          label={label}
          inputId={generatedId}
          variant={isViewEditMode ? 'offset' : undefined}
          required={required}
        />
      )}

      <div
        className={mergeCss([
          'relative flex w-full flex-col rounded-[20px] border bg-white transition-colors duration-200',
          shouldShowError && 'border-red-500',
          !shouldShowError && isFocused && 'border-[#008CEE]',
          !shouldShowError && !isFocused && 'border-gray-200',
          disabled && 'cursor-not-allowed opacity-50',
        ])}
      >
        <RichTextEditorToolbar
          editor={editor}
          buttons={buttons}
          disabled={disabled}
        />

        <EditorContent
          id={generatedId}
          editor={editor}
          aria-invalid={shouldShowError ? true : undefined}
          aria-describedby={shouldShowError ? messageId : undefined}
          className={mergeCss(contentCss)}
        />

        {shouldShowError && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>

      {shouldShowError && (
        <Text id={messageId} variant="caption" className="text-red-500">
          {error}
        </Text>
      )}
    </div>
  );
}
