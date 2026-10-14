import { fireEvent, render } from '@testing-library/react-native';
import { Radio } from './Radio';

describe('Radio component', () => {
  it('renders the provided displayValue text', async () => {
    const { getByText } = await render(
      <Radio
        displayValue="Option Test"
        onPress={vi.fn()}
        value="test"
        selectedValue="other"
      />,
    );
    expect(getByText('Option Test')).toBeTruthy();
  });

  it('calls onPress with value when pressed', async () => {
    const mockOnPress = vi.fn();
    const { getByText } = await render(
      <Radio
        displayValue="Pressable Option"
        onPress={mockOnPress}
        value="value1"
        selectedValue="notValue1"
      />,
    );
    await fireEvent.press(getByText('Pressable Option'));
    expect(mockOnPress).toHaveBeenCalledWith('value1');
  });

  it('sets the correct accessibilityHint based on value', async () => {
    const { getByA11yHint } = await render(
      <Radio
        displayValue="Accessibility Test"
        onPress={vi.fn()}
        value="test"
        selectedValue="other"
      />,
    );

    const button = getByA11yHint('selects test');
    expect(button).toBeTruthy();
  });
});
