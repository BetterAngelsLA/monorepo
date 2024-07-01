import { fireEvent, render } from '@testing-library/react-native';
import { TextButton } from './TextButton';

describe('TextButton Component', () => {
  it('renders with correct title', () => {
    const { getByText } = render(
      <TextButton accessibilityHint={''} title="Click Me" color="blue" />
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <TextButton
        accessibilityHint={''}
        title="Press Me"
        onPress={mockOnPress}
        color="blue"
      />
    );

    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled and pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <TextButton
        title="Disabled Button"
        accessibilityHint={''}
        onPress={mockOnPress}
        disabled
        color="blue"
      />
    );

    fireEvent.press(getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('is accessible by role', () => {
    const { getByRole } = render(
      <TextButton
        title="Accessible Button"
        color="blue"
        accessibilityHint={''}
      />
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
