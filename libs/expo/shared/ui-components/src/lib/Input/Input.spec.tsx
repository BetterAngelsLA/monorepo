/**
 * The field-as-a-button mode.
 *
 * `Picker` opens its modal from this instead of from `onFocus`, which is what
 * let the whole web-only refocus workaround go away: react-native-web's Modal
 * hands focus back to whatever opened it, so an `onFocus`-opened picker re-opened
 * itself every time it closed.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Input } from './Input';

const noop = () => undefined;

describe('Input as a press target', () => {
  it('is a button that carries the label and the current value', async () => {
    const onPress = vi.fn();

    await render(
      <Input
        label="Default Team"
        placeholder="Select team"
        value="Echo Park Outreach"
        onPress={onPress}
      />,
    );

    const field = screen.getByRole('button', {
      name: 'Default Team: Echo Park Outreach',
    });

    await fireEvent.press(field);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('falls back to the placeholder as the value', async () => {
    await render(
      <Input
        label="Default Team"
        placeholder="Select team"
        value=""
        onPress={noop}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Default Team: Select team' }),
    ).toBeOnTheScreen();
  });

  it('stays a plain text field when no onPress is given', async () => {
    await render(<Input placeholder="Name" value="Ada" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByDisplayValue('Ada')).toBeOnTheScreen();
  });
});
