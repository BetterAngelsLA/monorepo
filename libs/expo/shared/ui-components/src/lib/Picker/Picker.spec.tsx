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

it('reports a clear when the field holds a value', async () => {
  const onClear = vi.fn();

  await render(
    <Picker
      label="Team"
      items={items}
      placeholder="Select team"
      selectedValue="echo-park"
      onClear={onClear}
    />,
  );

  // The control names what it clears, rather than a second anonymous
  // "clear input" on a screen that may hold several of them.
  await fireEvent.press(screen.getByLabelText('clear Team'));

  expect(onClear).toHaveBeenCalled();
});

it('falls back to a generic label without a field label', async () => {
  const onClear = vi.fn();

  await render(
    <Picker
      items={items}
      placeholder="Select team"
      selectedValue="echo-park"
      onClear={onClear}
    />,
  );

  await fireEvent.press(screen.getByLabelText('clear selection'));

  expect(onClear).toHaveBeenCalled();
});

it('offers no clear affordance when the field cannot be cleared', async () => {
  await render(
    <Picker
      label="Team"
      items={items}
      placeholder="Select team"
      selectedValue="echo-park"
    />,
  );

  expect(screen.queryByLabelText('clear Team')).toBeNull();
});
