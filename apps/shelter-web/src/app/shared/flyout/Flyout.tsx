import { mergeCss } from '../utils/styles/mergeCss';

export function Flyout(props: any) {
  const { children } = props;

  const flyoutCss = [
    'fixed',
    'top-0',
    'right-0',
    'h-full',
    'w-[96vw]',
    'bg-white',
    'shadow-lg',
    'z-[1000]',
    'animate-slideRightToLeft',
    'rounded-l-2xl'
  ];

  return <div className={mergeCss(flyoutCss)}>{children}</div>;
}
