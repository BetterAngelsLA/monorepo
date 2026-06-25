import { mergeCss } from '@monorepo/react/shared';
import type { Editor } from '@tiptap/react';
import { Bold, Italic, Link, List, ListOrdered, Quote } from 'lucide-react';

export type ToolbarButtonKey =
  | 'bold'
  | 'italic'
  | 'bulletList'
  | 'orderedList'
  | 'link'
  | 'blockquote';

export const DEFAULT_TOOLBAR_BUTTONS: ToolbarButtonKey[] = [
  'bold',
  'italic',
  'bulletList',
  'orderedList',
  'blockquote',
  'link',
];

type ToolbarButtonConfig = {
  ariaLabel: string;
  icon: React.ReactNode;
  isActive: (editor: Editor) => boolean;
  onClick: (editor: Editor) => void;
};

const TOOLBAR_BUTTON_CONFIG: Record<ToolbarButtonKey, ToolbarButtonConfig> = {
  bold: {
    ariaLabel: 'Bold',
    icon: <Bold size={14} />,
    isActive: (editor) => editor.isActive('bold'),
    onClick: (editor) => editor.chain().focus().toggleBold().run(),
  },
  italic: {
    ariaLabel: 'Italic',
    icon: <Italic size={14} />,
    isActive: (editor) => editor.isActive('italic'),
    onClick: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  bulletList: {
    ariaLabel: 'Bullet list',
    icon: <List size={14} />,
    isActive: (editor) => editor.isActive('bulletList'),
    onClick: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    ariaLabel: 'Ordered list',
    icon: <ListOrdered size={14} />,
    isActive: (editor) => editor.isActive('orderedList'),
    onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  blockquote: {
    ariaLabel: 'Blockquote',
    icon: <Quote size={14} />,
    isActive: (editor) => editor.isActive('blockquote'),
    onClick: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  link: {
    ariaLabel: 'Link',
    icon: <Link size={14} />,
    isActive: (editor) => editor.isActive('link'),
    onClick: (editor) => {
      if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
      } else {
        const url = window.prompt('Enter URL');

        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }
    },
  },
};

type TProps = {
  editor: Editor | null;
  buttons?: ToolbarButtonKey[];
  disabled?: boolean;
};

export function RichTextEditorToolbar(props: TProps) {
  const { editor, buttons = DEFAULT_TOOLBAR_BUTTONS, disabled = false } = props;

  return (
    <div className="flex gap-1 gap-x-4 border-b border-gray-200 px-3 py-2">
      {buttons.map((key) => {
        const config = TOOLBAR_BUTTON_CONFIG[key];

        return (
          <ToolbarButton
            key={key}
            onClick={() => editor && config.onClick(editor)}
            isActive={editor ? config.isActive(editor) : false}
            disabled={disabled}
            aria-label={config.ariaLabel}
          >
            {config.icon}
          </ToolbarButton>
        );
      })}
    </div>
  );
}

type ToolbarButtonProps = {
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
  children: React.ReactNode;
  'aria-label': string;
};

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  'aria-label': ariaLabel,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={mergeCss([
        'rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900',
        isActive && 'bg-gray-200 text-gray-900',
        disabled && 'cursor-not-allowed opacity-50',
      ])}
    >
      {children}
    </button>
  );
}
