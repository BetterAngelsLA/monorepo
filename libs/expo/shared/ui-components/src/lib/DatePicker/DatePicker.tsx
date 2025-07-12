import {
  INumericDatePickerProps,
  NumericDatePicker,
} from './NumericDatePicker';
import { IWheelDatePickerProps, WheelDatePicker } from './WheelDatePicker';

type IDatePickerProps =
  | ({ type: 'numeric' } & INumericDatePickerProps)
  | ({ type: 'wheel' } & IWheelDatePickerProps);

export function DatePicker(props: IDatePickerProps) {
  const { type, ...rest } = props;

  if (type === 'numeric') {
    return <NumericDatePicker {...(rest as INumericDatePickerProps)} />;
  }

  return <WheelDatePicker {...(rest as IWheelDatePickerProps)} />;
}
