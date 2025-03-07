import { Text, TextStyle } from 'react-native';
import { formatDateLocal } from './formatDateLocal';

type TProps = {
  date?: string | number | Date | null;
  format?: string;
  style?: TextStyle;
};

export function DateLocal(props: TProps) {
  const { date, format, style } = props;

  const formattedDate = formatDateLocal({
    date,
    format,
  });

  if (!formattedDate) {
    return null;
  }

  return <Text style={style}>{formattedDate}</Text>;
}
