import { fireEvent, render } from '@testing-library/react-native';
import { TextButton } from './TextButton';

describe('TextButton Component', () => {
  it('renders with correct title', async () => {
    const { getByText } = await render(
      <TextButton accessibilityHint={''} title="Click Me" color="blue" />,
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const mockOnPress = vi.fn();
    const { getByText } = await render(
      <TextButton
        accessibilityHint={''}
        title="Press Me"
        onPress={mockOnPress}
        color="blue"
      />,
    );

    await fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled and pressed', async () => {
    const mockOnPress = vi.fn();
    const { getByText } = await render(
      <TextButton
        title="Disabled Button"
        accessibilityHint={''}
        onPress={mockOnPress}
        disabled
        color="blue"
      />,
    );

    await fireEvent.press(getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('is accessible by role', async () => {
    const { getByRole } = await render(
      <TextButton
        title="Accessible Button"
        color="blue"
        accessibilityHint={''}
      />,
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
