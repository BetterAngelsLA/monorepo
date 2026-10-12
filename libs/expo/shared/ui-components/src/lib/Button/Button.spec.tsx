import { fireEvent, render } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct title', async () => {
    const { getByText } = await render(
      <Button
        accessibilityHint={''}
        title="Click Me"
        variant="primary"
        size="sm"
      />,
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const mockOnPress = vi.fn();
    const { getByText } = await render(
      <Button
        title="Press Me"
        onPress={mockOnPress}
        variant="primary"
        size="sm"
        accessibilityHint={''}
      />,
    );

    await fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled and pressed', async () => {
    const mockOnPress = vi.fn();
    const { getByText } = await render(
      <Button
        accessibilityHint={''}
        title="Disabled Button"
        onPress={mockOnPress}
        disabled
        variant="primary"
        size="sm"
      />,
    );

    await fireEvent.press(getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders correctly with different variants', async () => {
    const variants: Array<
      'primary' | 'secondary' | 'negative' | 'sky' | 'dark'
    > = ['primary', 'secondary', 'negative', 'sky', 'dark'];
    // Sequential, not `forEach(async …)`: render is async in RNTL 14, and an
    // un-awaited render leaks into the next test's screen.
    for (const [index, variant] of variants.entries()) {
      const testID = `button-${variant}-${index}`;
      const { getByTestId } = await render(
        <Button
          accessibilityHint={''}
          title={variant}
          variant={variant}
          size="sm"
          testID={testID}
        />,
      );
      expect(getByTestId(testID)).toBeTruthy();
    }
  });

  it('is accessible by role', async () => {
    const { getByRole } = await render(
      <Button
        accessibilityHint={''}
        title="Accessible Button"
        variant="primary"
        size="sm"
      />,
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
