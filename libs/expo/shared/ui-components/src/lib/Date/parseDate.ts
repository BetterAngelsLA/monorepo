import { format, parse } from 'date-fns';

const DEFAULT_OUTPUT_FORMAT = 'MM/dd/yyyy';

interface TFormattedLength {
  date: string;
  inputFormat: string;
  outputFormat?: string;
}

export function parseDate(props: TFormattedLength): string {
  const { date, inputFormat, outputFormat = DEFAULT_OUTPUT_FORMAT } = props;

  if (!date) {
    return '';
  }

  try {
    const parsed = parse(date, inputFormat, new Date());

    return format(parsed, outputFormat);
  } catch {
    console.error(
      `parseDate: failed to parse date: [${date}] with inputFormat [${inputFormat}]`
    );

    return '';
  }
}
