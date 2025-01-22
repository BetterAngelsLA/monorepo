import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  title: string;
  subtitle?: string;
};

export function QuestionHeader(props: IProps) {
  const { className, title, subtitle } = props;

  const parentCss = [
    'border-l-[10px]',
    'border-brand-sky-blue',
    'pl-4',
    'lg:pl-8',
    className,
  ];

  const titleCss = ['text-2xl', 'leading-normal', 'lg:text-5xl', 'font-bold'];

  const subtitleCss = ['text-2xl', 'leading-normal', 'lg:text-[42px]'];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(titleCss)}>{title}</div>

      {!!subtitle && <div className={mergeCss(subtitleCss)}>{subtitle}</div>}
    </div>
  );
}
