import { fireEvent, render } from '@testing-library/react-native';
import { Checkbox } from './Checkbox';

describe('Checkbox Component', () => {
  const accessibilityLabel = 'Custom Accessibility Label';
  const accessibilityHint = 'Custom Accessibility Hint';

  it('renders with correct label', () => {
    const { getByText } = render(
      <Checkbox
        accessibilityHint={accessibilityHint}
        label="Check Me"
        onCheck={() => console.log('Checkbox checked')}
      />
    );
    expect(getByText('Check Me')).toBeTruthy();
  });

  it('calls onCheck with true when unchecked and pressed', () => {
    const mockOnCheck = jest.fn();
    const { getByText } = render(
      <Checkbox
        accessibilityHint={accessibilityHint}
        label="Check Me"
        onCheck={mockOnCheck}
      />
    );

    fireEvent.press(getByText('Check Me'));
    expect(mockOnCheck).toHaveBeenCalledWith(true);
  });

  it('calls onCheck with false when checked and pressed', () => {
    const mockOnCheck = jest.fn();
    const { getByText } = render(
      <Checkbox
        accessibilityHint={accessibilityHint}
        label="Uncheck Me"
        onCheck={mockOnCheck}
      />
    );

    const checkboxLabel = getByText('Uncheck Me');
    fireEvent.press(checkboxLabel);
    fireEvent.press(checkboxLabel);

    expect(mockOnCheck).toHaveBeenCalledWith(false);
  });

  it('has correct accessibility label and hint', () => {
    const { getByText } = render(
      <Checkbox
        label="Accessible Checkbox"
        onCheck={() => console.log('Checkbox checked')}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      />
    );
    expect(getByText(accessibilityLabel)).toBeTruthy();
  });

  it('is accessible by role', () => {
    const { getByRole } = render(
      <Checkbox
        accessibilityHint={accessibilityHint}
        label="Accessible Checkbox"
        onCheck={() => console.log('Checkbox checked')}
      />
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
