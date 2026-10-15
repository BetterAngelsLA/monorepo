import { fireEvent, render } from '@testing-library/react-native';
import { TextInput, View } from 'react-native';
import type { ComponentProps } from 'react';
import { WheelDatePicker } from './WheelDatePicker';

vi.mock('@monorepo/expo/shared/icons', () => ({
  CalendarLineIcon: () => <View />,
  ClockIcon: () => <View />,
}));
vi.mock('../Input', () => ({
  Input: (props: ComponentProps<typeof TextInput>) => <TextInput {...props} />,
}));
vi.mock('@react-native-community/datetimepicker', () => ({
  default: (props: {
    onChange: (event: { type: string }, date?: Date) => void;
  }) => <View testID="native-calendar" {...props} />,
}));

it('forwards its public testId to the actual input and opens the calendar on focus', async () => {
  const { getByTestId } = await render(
    <WheelDatePicker
      mode="date"
      format="MM/dd/yyyy"
      testId="arrival-date"
      onChange={vi.fn()}
    />,
  );
  await fireEvent(getByTestId('arrival-date'), 'focus');
  expect(getByTestId('native-calendar')).toBeTruthy();
});

it('passes a selected calendar date through and leaves the answer unchanged on cancellation', async () => {
  const onChange = vi.fn();
  const { getByTestId, queryByTestId } = await render(
    <WheelDatePicker
      mode="date"
      format="MM/dd/yyyy"
      testId="arrival-date"
      onChange={onChange}
    />,
  );
  await fireEvent(getByTestId('arrival-date'), 'focus');
  const date = new Date(2026, 8, 10);
  await fireEvent(
    getByTestId('native-calendar'),
    'change',
    { type: 'set' },
    date,
  );
  expect(onChange).toHaveBeenCalledExactlyOnceWith(date);
  await fireEvent(getByTestId('native-calendar'), 'change', {
    type: 'dismissed',
  });
  expect(queryByTestId('native-calendar')).toBeNull();
  expect(onChange).toHaveBeenCalledOnce();
});
