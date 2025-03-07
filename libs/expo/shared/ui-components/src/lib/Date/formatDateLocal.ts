import { format as fnsFormat } from 'date-fns';

const DEFAULT_FORMAT = 'MM/dd/yyyy';

interface TFormattedLength {
  date?: string | number | Date | null;
  format?: string;
}

export function formatDateLocal(props: TFormattedLength) {
  const { date, format = DEFAULT_FORMAT } = props;

  if (!date) {
    return '';
  }

  try {
    return fnsFormat(date, format);
  } catch (e) {
    console.error(`formatDateLocal: failed to format date: ${date}: ${e}`);

    return '';
  }
}
