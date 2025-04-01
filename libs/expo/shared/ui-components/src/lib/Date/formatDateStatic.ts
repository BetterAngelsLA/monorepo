import { format, parse } from 'date-fns';

const DEFAULT_OUTPUT_FORMAT = 'MM/dd/yyyy';

interface TProps {
  date: string;
  inputFormat: string;
  outputFormat?: string;
}

export function formatDateStatic(props: TProps): string {
  const { date, inputFormat, outputFormat = DEFAULT_OUTPUT_FORMAT } = props;

  if (!date) {
    return '';
  }

  try {
    const parsed = parse(date, inputFormat, new Date());

    return format(parsed, outputFormat);
  } catch {
    console.error(
      `[formatDateStatic]: failed to format date: [${date}] with inputFormat [${inputFormat}] and outputFormat [${outputFormat}]`
    );

    return '';
  }
}
