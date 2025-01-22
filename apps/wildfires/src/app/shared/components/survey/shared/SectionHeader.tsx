import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  title: string;
};

export function SectionHeader(props: IProps) {
  const { className, title } = props;

  const parentCss = [
    'text-base',
    'md:text-2xl',
    'uppercase',
    'leading-normal',
    'md:leading-normal', // required to override text-base line-height
    'font-bold',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{title}</div>;
}
