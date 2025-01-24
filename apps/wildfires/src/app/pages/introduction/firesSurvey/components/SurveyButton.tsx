import { MouseEventHandler, PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';
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
  | (IBaseButton & { onClick?: MouseEventHandler; href?: never })
  | (IBaseButton & { href: string; onClick?: MouseEventHandler });

export function SurveyButton(props: TButtonProps) {
  const { className, dark, onClick, disabled, href, children } = props;
  const navigate = useNavigate();

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
    const handleClick = (event: any) => {
      if (onClick) {
        onClick(event);
      }

      navigate(href);
    };
    return (
      <Button className={mergeCss(parentCss)} onClick={handleClick}>
        {children}
      </Button>
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
