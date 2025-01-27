import { mergeCss } from '../../../shared/utils/styles/mergeCss';

type IProps = {
  className?: string;
};

export function GetStartedHeader(props: IProps) {
  const { className } = props;

  const parentCss = [
    'border-l-[10px]',
    'border-brand-sky-blue',
    'pl-4',
    'lg:pl-8',
    className,
  ];

  const titleCss = [
    'text-2xl',
    'leading-normal',
    'lg:text-[40px]',
    'font-bold',
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(titleCss)}>Get Started</div>
    </div>
  );
}
