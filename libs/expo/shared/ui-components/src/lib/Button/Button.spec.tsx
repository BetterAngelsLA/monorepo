import { fireEvent, render } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct title', () => {
    const { getByText } = render(
      <Button
        accessibilityHint={''}
        title="Click Me"
        variant="primary"
        size="sm"
      />
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
        accessibilityHint={''}
      />
    );

    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled and pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button
        accessibilityHint={''}
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

  it('renders correctly with different variants', () => {
    const variants: Array<
      'primary' | 'secondary' | 'negative' | 'sky' | 'dark'
    > = ['primary', 'secondary', 'negative', 'sky', 'dark'];
    variants.forEach((variant, index) => {
      const testID = `button-${variant}-${index}`;
      const { getByTestId } = render(
        <Button
          accessibilityHint={''}
          title={variant}
          variant={variant}
          size="sm"
          testID={testID}
        />
      );
      expect(getByTestId(testID)).toBeTruthy();
    });
  });

  it('is accessible by role', () => {
    const { getByRole } = render(
      <Button
        accessibilityHint={''}
        title="Accessible Button"
        variant="primary"
        size="sm"
      />
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
