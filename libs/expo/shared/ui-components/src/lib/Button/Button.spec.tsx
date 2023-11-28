import { fireEvent, render } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct title', () => {
    const { getByText } = render(
      <Button title="Click Me" variant="primary" size="sm" />
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button
        title="Press Me"
        onPress={mockOnPress}
        variant="primary"
        size="sm"
      />
    );

    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled and pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button
        title="Disabled Button"
        onPress={mockOnPress}
        disabled
        variant="primary"
        size="sm"
      />
    );

    fireEvent.press(getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });
  // Add more tests as needed
});
