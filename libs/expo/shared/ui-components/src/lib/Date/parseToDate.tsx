import { isValid, parse } from 'date-fns';

interface TProps {
  date: string;
  inputFormat: string;
}

export function parseToDate(props: TProps): Date | null {
  const { date, inputFormat } = props;

  try {
    const parsed = parse(date, inputFormat, new Date());

    if (!isValid(parsed)) {
      throw '';
    }

    return parsed;
  } catch {
    console.error(
      `[parseToDate]: failed to parse date: [${date}] with inputFormat [${inputFormat}]`
    );

    return null;
  }
}
