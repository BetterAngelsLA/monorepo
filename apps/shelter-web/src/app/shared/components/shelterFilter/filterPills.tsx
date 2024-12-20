import { useAtom } from 'jotai';
import { shelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { mergeCss } from '../../utils/styles/mergeCss';
import { getFilterLabel } from './shelterFilter.config';

type IProps = {
  className?: string;
};

export function FilterPills(props: IProps) {
  const { className } = props;

  const [filters] = useAtom(shelterFiltersAtom);

  if (!filters) {
    return null;
  }

  const pillTextArr: string[] = [];

  for (const [key, valueArr] of Object.entries(filters)) {
    valueArr?.forEach((val) => {
      const label = getFilterLabel(key as any, val);

      if (label) {
        pillTextArr.push(label);
      }
    });
  }

  const parentCss = ['flex', 'flex-wrap', className];

  const labelCss = [
    'mr-2',
    'last:mr-0',
    'p-2',
    'text-xs',
    'bg-primary-95',
    'rounded',
    'mb-2',
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {pillTextArr.map((text, idx) => {
        return (
          <div className={mergeCss(labelCss)} key={idx}>
            {text}
          </div>
        );
      })}
    </div>
  );
}
