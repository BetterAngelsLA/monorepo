import { fireEvent, render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { Select } from './Select';

describe('Select Component', () => {
  const mockData = ['Option 1', 'Option 2', 'Option 3'];
  const mockSetExternalValue = jest.fn();

  it('renders correctly with placeholder', () => {
    const { getByText } = render(
      <Select
        data={mockData}
        setExternalValue={mockSetExternalValue}
        placeholder="Select an option"
      />
    );
    expect(getByText('Select an option')).toBeTruthy();
  });

  it('opens dropdown when pressed', () => {
    const { getByText, getAllByText } = render(
      <Select
        data={mockData}
        setExternalValue={mockSetExternalValue}
        placeholder="Select an option"
      />
    );
    fireEvent.press(getByText('Select an option'));
    expect(getAllByText(mockData[0])[0]).toBeTruthy();
  });

  it('selects an item and calls setExternalValue', () => {
    const { getByText } = render(
      <Select
        data={mockData}
        setExternalValue={mockSetExternalValue}
        placeholder="Select an option"
      />
    );

    // Open dropdown
    fireEvent.press(getByText('Select an option'));

    // Select an item
    fireEvent.press(getByText(mockData[0]));

    expect(mockSetExternalValue).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders correctly with a label', () => {
    const { getByText } = render(
      <Select
        data={mockData}
        setExternalValue={mockSetExternalValue}
        label="Select Label"
        placeholder="Select an option"
      />
    );
    expect(getByText('Select Label')).toBeTruthy();
  });

  it('positions dropdown correctly based on screen space', () => {
    // Mocking Dimensions.get to simulate different screen sizes
    const mockDimensions = {
      width: 375,
      height: 667,
      scale: 2, // Add scale
      fontScale: 1, // Add fontScale
    };
    jest.spyOn(Dimensions, 'get').mockReturnValue(mockDimensions);

    const { getByText, getByTestId } = render(
      <Select
        data={mockData}
        setExternalValue={mockSetExternalValue}
        placeholder="Select an option"
      />
    );

    // Assuming the dropdown has a testID set for position verification
    fireEvent.press(getByText('Select an option'));
    const dropdown = getByTestId('select-dropdown');
    expect(dropdown.props.style).toContainEqual({ top: '102%' }); // Assuming default position is bottom
  });

  it('closes the dropdown when an item is selected', () => {
    const { getByText, queryByText } = render(
      <Select
        data={mockData}
        setExternalValue={mockSetExternalValue}
        placeholder="Select an option"
      />
    );

    // Open dropdown
    fireEvent.press(getByText('Select an option'));

    // Select an item
    fireEvent.press(getByText(mockData[0]));

    // Dropdown should no longer be visible
    expect(queryByText(mockData[1])).toBeNull();
  });
});
