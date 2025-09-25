import { MultiSelectInfinite } from './components/MultiSelectInfinite';
import { MultiSelectStatic } from './components/MultiSelectStatic';
import { MultiSelectProps } from './types';

export function MultiSelect_V2<T>(props: MultiSelectProps<T>) {
  const { infinite } = props;

  return infinite ? (
    <MultiSelectInfinite<T> {...props} />
  ) : (
    <MultiSelectStatic<T> {...props} />
  );
}
