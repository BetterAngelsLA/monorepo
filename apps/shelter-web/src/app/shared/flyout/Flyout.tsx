import { mergeCss } from '../utils/styles/mergeCss';

export function Flyout(props: any) {
  const { children } = props;

  const flyoutCss = [
    'fixed',
    'top-0',
    'right-0',
    'h-full',
    'w-64',
    'bg-white',
    'shadow-lg',
    'z-[1000]',
    'animate-slideRightToLeft', // custom animation class
  ];

  return <div className={mergeCss(flyoutCss)}>{children}</div>;
}
