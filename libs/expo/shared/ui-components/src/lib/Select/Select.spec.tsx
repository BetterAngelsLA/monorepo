import { render } from '@testing-library/react-native';
import { Select } from './Select';

describe('Select Component', () => {
  const mockData = ['Option 1', 'Option 2', 'Option 3'];
  const mockSetExternalValue = jest.fn();

  it('renders correctly with placeholder', () => {
    const { getByText } = render(
      <Select
        items={mockData.map((item) => ({ title: item }))}
        onValueChange={mockSetExternalValue}
        placeholder="Select an option"
      />
    );
    expect(getByText('Select an option')).toBeTruthy();
  });

  it('renders correctly with a label', () => {
    const { getByText } = render(
      <Select
        items={mockData.map((item) => ({ title: item }))}
        onValueChange={mockSetExternalValue}
        label="Select Label"
        placeholder="Select an option"
      />
    );
    expect(getByText('Select Label')).toBeTruthy();
  });
});
