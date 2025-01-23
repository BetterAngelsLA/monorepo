import { MouseEventHandler, PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../../shared/components/button/Button';
import { mergeCss } from '../../../../shared/utils/styles/mergeCss';

interface IBaseButton extends PropsWithChildren {
  className?: string;
  disabled?: boolean;
  dark?: true;
  onClick?: MouseEventHandler;
  href?: string;
}

export type TButtonProps =
  | (IBaseButton & { onClick: MouseEventHandler; href?: never })
  | (IBaseButton & { href: string; onClick?: never });

export function SurveyButton(props: TButtonProps) {
  const { className, dark, onClick, disabled, href, children } = props;

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
    disabled ? 'opacity-90x text-[#9AA3AA]' : '',
    className,
  ];

  if (href) {
    return (
      <Link className={mergeCss(parentCss)} to={href}>
        {children}
      </Link>
    );
  }

  if (!onClick) {
    return null;
  }

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
