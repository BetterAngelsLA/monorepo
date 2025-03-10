import { fireEvent, render } from '@testing-library/react-native';
import { Radio } from './Radio';

describe('Radio component', () => {
  it('renders the provided displayValue text', () => {
    const { getByText } = render(
      <Radio
        displayValue="Option Test"
        onPress={jest.fn()}
        value="test"
        selectedItem="other"
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
        selectedItem="notValue1"
      />
    );
    fireEvent.press(getByText('Pressable Option'));
    expect(mockOnPress).toHaveBeenCalledWith('value1');
  });

  it('does not call onPress when value is not provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Radio
        displayValue="No Value Option"
        onPress={mockOnPress}
        selectedItem="someValue"
      />
    );
    fireEvent.press(getByText('No Value Option'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('sets the correct accessibilityHint based on displayValue', () => {
    const { getByA11yHint } = render(
      <Radio
        displayValue="Accessibility Test"
        onPress={jest.fn()}
        value="test"
        selectedItem="other"
      />
    );

    const button = getByA11yHint('selects Accessibility Test');
    expect(button).toBeTruthy();
  });

  it('renders with error state styling when error is provided (snapshot)', () => {
    const tree = render(
      <Radio
        displayValue="Error Option"
        onPress={jest.fn()}
        value="value1"
        selectedItem="other"
        error="error message"
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders with selected styling when value equals selectedItem (snapshot)', () => {
    const tree = render(
      <Radio
        displayValue="Selected Option"
        onPress={jest.fn()}
        value="value1"
        selectedItem="value1"
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
