import { mergeCss } from '@monorepo/react/shared';
import { TShelterPropertyFilters } from '../ShelterSearch';
import { getFilterLabel } from './config';

type IProps = {
  className?: string;
  filters: TShelterPropertyFilters;
};

export function FilterPills(props: IProps) {
  const { className, filters } = props;

  if (!filters) {
    return null;
  }

  const pillTextArr: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'openNow') {
      if (value) {
        pillTextArr.push('Open now');
      }
      continue;
    }

    (value as string[] | undefined)?.forEach((val) => {
      const label = getFilterLabel(
        key as keyof TShelterPropertyFilters,
        val as never
      );

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
