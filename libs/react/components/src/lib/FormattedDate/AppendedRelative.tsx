import { mergeCss } from '@monorepo/react/shared';
import { formatValue } from './formatValue';
import { toValidDate } from './toValidDate';

type TAppendedRelative = {
  value: string | Date | null | undefined;
  className?: string;
};

export function AppendedRelative(props: TAppendedRelative) {
  const { value, className } = props;

  const date = toValidDate(value);

  if (!date) {
    return null;
  }

  const relativeDate = formatValue(date, 'relative');

  const css = ['ml-2', 'italic'];

  return <span className={mergeCss([css, className])}>({relativeDate})</span>;
}
