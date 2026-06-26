import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  content?: ReactNode;
  label?: string;
  className?: string;
  lineClassName?: string;
  labelClassName?: string;
};

export function Divider(props: TProps) {
  const { content, label, className, lineClassName, labelClassName } = props;

  const labelCss = [
    'text-xs',
    'leading-none',
    'relative',
    '-top-px',
    labelClassName,
  ];

  const dividerContent =
    content ??
    (label ? <span className={mergeCss(labelCss)}>{label}</span> : null);

  const parentCss = [
    'flex',
    'items-center',
    dividerContent ? 'gap-2' : '',
    className,
  ];

  const dividerLineCss = ['h-px', 'flex-1', 'bg-gray-300', lineClassName];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(dividerLineCss)} />

      {!!dividerContent && <div className="shrink-0">{dividerContent}</div>}

      <div className={mergeCss(dividerLineCss)} />
    </div>
  );
}
