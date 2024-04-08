import { fireEvent, render } from '@testing-library/react-native';
import { Radio } from './Radio'; // Adjust the import path as necessary

describe('Radio Component', () => {
  it('renders with correct label', () => {
    const { getByText } = render(
      <Radio
        label="Select Me"
        onPress={() => {
          console.log('Radio selected');
        }}
        accessibilityHint="Select this radio"
        value="selectMe"
      />
    );
    expect(getByText('Select Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Radio
        label="Select Me"
        onPress={mockOnPress}
        accessibilityHint="Select this radio"
        value="selectMe"
      />
    );

    fireEvent.press(getByText('Select Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('is accessible by role', () => {
    const { getByRole } = render(
      <Radio
        label="Accessible Radio"
        onPress={() => {
          console.log('Radio selected');
        }}
        accessibilityHint="Select this radio"
        value="accessibleRadio"
      />
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
