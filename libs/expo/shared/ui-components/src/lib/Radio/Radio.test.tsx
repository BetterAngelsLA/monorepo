import { fireEvent, render } from '@testing-library/react-native';
import { Radio } from './Radio';

describe('Radio component', () => {
  it('renders the provided displayValue text', () => {
    const { getByText } = render(
      <Radio
        displayValue="Option Test"
        onPress={jest.fn()}
        value="test"
        selectedValue="other"
      />
    );
    expect(getByText('Option Test')).toBeTruthy();
  });

  it('calls onPress with value when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Radio
        displayValue="Pressable Option"
        onPress={mockOnPress}
        value="value1"
        selectedValue="notValue1"
      />
    );
    fireEvent.press(getByText('Pressable Option'));
    expect(mockOnPress).toHaveBeenCalledWith('value1');
  });

  it('sets the correct accessibilityHint based on value', () => {
    const { getByA11yHint } = render(
      <Radio
        displayValue="Accessibility Test"
        onPress={jest.fn()}
        value="test"
        selectedValue="other"
      />
    );

    const button = getByA11yHint('selects test');
    expect(button).toBeTruthy();
  });
});
