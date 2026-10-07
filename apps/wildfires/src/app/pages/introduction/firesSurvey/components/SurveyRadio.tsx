import { mergeCss } from '@monorepo/react/shared';
import { ReactElement } from 'react';

type IProps = {
  name: string;
  value: string;
  label?: string;
  selected?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

export function SurveyRadio(props: IProps): ReactElement {
  const { name, value, label, onChange, selected, className } = props;

  const parentCss = [
    'flex',
    'items-start',
    'w-full',
    'items-center',
    'px-4',
    'py-4',
    'lg:py-6',
    'cursor-pointer',
    'text-brand-dark-blue',
    'shadow-brand-dark-blue',
    'border-[3px]',
    selected ? 'border-brand-dark-blue' : 'border-[#DBDBDB]',
    'rounded-xl',
    'md:rounded-[20px]',
    className,
  ];

  const circleCss = ['border', 'border-brand-dark-blue', 'rounded-full'];

  const circleInnerCss = [
    'w-[18px]',
    'h-[18px]',
    'm-0.5',
    'rounded-full',
    selected ? 'bg-brand-dark-blue' : 'bg-transparent',
  ];

  const labelCss = ['ml-6', 'font-bold', 'text-base', 'md:text-xl'];

  return (
    <label className={mergeCss(parentCss)}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only peer"
      />
      <div
        className={mergeCss([
          circleCss,
          'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
        ])}
      >
        <div className={mergeCss(circleInnerCss)}></div>
      </div>
      <div className={mergeCss(labelCss)}>{label || value}</div>
    </label>
  );
}
