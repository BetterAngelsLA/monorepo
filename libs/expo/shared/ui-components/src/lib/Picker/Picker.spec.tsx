/**
 * The picker opens from a press on the field — react-native-web's Modal hands focus
 * back to whatever opened it, so an `onFocus`-opened field could not be dismissed.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import Picker from './Picker';
import { TPickerItem } from './types';

const items: TPickerItem[] = [
  { value: 'echo-park', displayValue: 'Echo Park Outreach' },
  { value: 'silver-lake', displayValue: 'Silver Lake Outreach' },
];

it('opens from a press on the field and reports the chosen value', async () => {
  const onChange = vi.fn();

  await render(
    <Picker items={items} placeholder="Select team" onChange={onChange} />,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Select team' }));

  await fireEvent.press(screen.getByText('Silver Lake Outreach'));

  expect(onChange).toHaveBeenCalledWith('silver-lake');
});
