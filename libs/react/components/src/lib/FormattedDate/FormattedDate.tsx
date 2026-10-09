import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { AppendedRelative } from './AppendedRelative';
import { FormattedDatePreset, formatValue } from './formatValue';
import { toValidDate } from './toValidDate';

type TProps = {
  value: string | Date | null | undefined;
  /** Output style: "Oct 1, 2026" | "Oct 1, 2026, 2:35 PM" | "3 days ago". */
  preset?: FormattedDatePreset;
  /** Rendered when the value is empty or invalid (default: nothing). */
  fallback?: ReactNode;
  className?: string;
  /** Render relative format in addition to data. */
  appendRelative?: boolean;
  appendRelativeClassName?: string;
};

export function FormattedDate(props: TProps) {
  const {
    value,
    preset = 'date-time',
    fallback = null,
    appendRelative,
    appendRelativeClassName,
    className,
  } = props;

  const date = toValidDate(value);

  if (!date) {
    return <>{fallback}</>;
  }

  return (
    <time dateTime={date.toISOString()} className={mergeCss([className])}>
      <span>{formatValue(date, preset)}</span>

      {appendRelative && (
        <AppendedRelative value={date} className={appendRelativeClassName} />
      )}
    </time>
  );
}
