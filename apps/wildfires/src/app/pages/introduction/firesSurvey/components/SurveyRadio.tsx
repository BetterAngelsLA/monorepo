import { ReactElement } from 'react';
import { mergeCss } from '../../../../shared/utils/styles/mergeCss';

type IProps = {
  name: string;
  label?: string;
  selected?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

export function SurveyRadio(props: IProps): ReactElement {
  const { name, label, onChange, selected, className } = props;

  const parentCss = [
    'flex',
    'items-start',
    'w-full',
    'items-center',
    'px-4',
    'py-4',
    'lg:py-6',
    'border',
    'rounded-lg',
    'cursor-pointer',
    'text-brand-dark-blue',
    selected ? 'border-brand-dark-blue' : 'border-color-neutral-90',
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

  return (
    <label className={mergeCss(parentCss)}>
      <input
        type="radio"
        name={name}
        value={name}
        checked={selected}
        onChange={(e) => onChange(e.target.value)}
        className="hidden"
      />
      <div className={mergeCss(circleCss)}>
        <div className={mergeCss(circleInnerCss)}></div>
      </div>
      <div className="ml-6">{label || name}</div>
    </label>
  );
}
