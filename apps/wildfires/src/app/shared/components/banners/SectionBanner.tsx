import { mergeCss } from '../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  title: string;
  subtitle?: string;
  variant?: 'med' | 'large';
};

export function SectionBanner(props: IProps) {
  const { className, title, subtitle, variant = 'large' } = props;

  const parentCss = [
    'border-l-[10px]',
    'border-brand-sky-blue',
    'pl-4',
    'lg:pl-8',
    className,
  ];

  const titleCss = [
    'font-bold',
    'leading-normal',
    'text-2xl',
    variant === 'large' ? 'lg:text-5xl' : 'lg:text-[32px]',
  ];

  const subtitleCss = [
    'text-2xl',
    'leading-normal',
    'md:leading-[4.5rem]',
    'lg:text-[42px]',
  ];

  if (!title && !subtitle) {
    return null;
  }

  return (
    <div className={mergeCss(parentCss)}>
      {!!title && <div className={mergeCss(titleCss)}>{title}</div>}

      {!!subtitle && <div className={mergeCss(subtitleCss)}>{subtitle}</div>}
    </div>
  );
}
