import { MouseEventHandler, PropsWithChildren, ReactElement } from 'react';
import { Button } from '../../../../shared/components/button/Button';
import { mergeCss } from '../../../../shared/utils/styles/mergeCss';

export interface IBaseButton extends PropsWithChildren {
  className?: string;
  disabled?: boolean;
  dark?: true;
  onClick: MouseEventHandler;
}

export function SurveyButton(props: IBaseButton): ReactElement {
  const { className, dark, onClick, disabled, children } = props;

  const parentCss = [
    'flex',
    'items-center',
    'w-full',
    'px-8',
    'py-4',
    'rounded-full',
    'font-bold',
    'text-base',
    'border-[3px]',
    'border-brand-dark-blue',
    dark ? 'bg-brand-dark-blue' : '',
    dark ? 'text-white' : 'brand-dark-blue',
    disabled ? 'opacity-90' : '',
    className,
  ];

  return (
    <Button
      className={mergeCss(parentCss)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
