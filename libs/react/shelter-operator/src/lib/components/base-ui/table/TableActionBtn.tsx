import { mergeCss } from '@monorepo/react/shared';
import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

export type TActionBtnVariant = 'default' | 'danger';

/** Standard row actions that come with a built-in icon and colour. */
export type TActionBtnAction = 'edit' | 'delete';

type TProps = {
  onClick: () => void;
  /** Accessible name. Required: row actions are icon-only in practice. */
  label: string;
  /**
   * Well-known action: supplies the default icon (and delete's danger colour).
   * Omit it for a custom action and pass `children` instead.
   */
  action?: TActionBtnAction;
  /** Overrides the action's default icon. */
  children?: ReactNode;
  /** Overrides the action's default colour. */
  variant?: TActionBtnVariant;
  disabled?: boolean;
  className?: string;
};

const variantClasses: Record<TActionBtnVariant, string> = {
  default: 'text-gray-500',
  danger: 'text-red-500',
};

const actionPresets: Record<
  TActionBtnAction,
  { icon: ReactNode; variant: TActionBtnVariant }
> = {
  edit: { icon: <Pencil size={16} />, variant: 'default' },
  delete: { icon: <Trash2 size={16} />, variant: 'danger' },
};

/**
 * Icon/text button for a table row's Actions column. Standard actions (`edit`,
 * `delete`) get a default icon; anything else passes its own `children`.
 */
export function TableActionBtn(props: TProps) {
  const {
    onClick,
    label,
    action,
    children,
    variant,
    disabled = false,
    className,
  } = props;

  const preset = action ? actionPresets[action] : undefined;

  const parentCss = [
    'opacity-70',
    'hover:opacity-100',
    'p-2',
    'rounded-full',
    'hover:bg-white',
    'hover:shadow-xl',
    'cursor-pointer',
    'disabled:opacity-60',
  ];

  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={mergeCss([
        variantClasses[variant ?? preset?.variant ?? 'default'],
        parentCss,
        className,
      ])}
      aria-label={label}
    >
      {children ?? preset?.icon}
    </button>
  );
}
