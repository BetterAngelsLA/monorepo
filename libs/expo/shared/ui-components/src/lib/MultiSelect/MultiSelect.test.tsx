import { fireEvent, render } from '@testing-library/react-native';
import { MultiSelect } from './MultiSelect';

interface TTestItem {
  id: string;
  label: string;
}

const mockOnChange = jest.fn();

const mockOptions: TTestItem[] = [
  { id: '1', label: 'Option A' },
  { id: '2', label: 'Option AB' },
  { id: '3', label: 'Option ABC' },
];

const baseProps = {
  title: 'Select Options',
  options: mockOptions,
  selected: [],
  onChange: mockOnChange,
  valueKey: 'id' as keyof TTestItem,
  labelKey: 'label' as keyof TTestItem,
};

describe('MultiSelect component', () => {
  beforeEach(() => {
    mockOnChange.mockClear(); // Clear previous calls before each test
  });

  it('renders all options', () => {
    const { getByText } = render(<MultiSelect {...baseProps} />);

    expect(getByText('Option A')).toBeTruthy();
    expect(getByText('Option AB')).toBeTruthy();
    expect(getByText('Option ABC')).toBeTruthy();
  });

  it('renders checked options as selected', () => {
    const props = {
      ...baseProps,
      selected: [mockOptions[0], mockOptions[1]],
    };

    const { queryByTestId } = render(<MultiSelect {...props} />);

    const checkmarkA = queryByTestId('checkbox-MultiSelect-0');
    const checkmarkB = queryByTestId('checkbox-MultiSelect-1');
    const checkmarkC = queryByTestId('checkbox-MultiSelect-2');

    expect(checkmarkA).toBeTruthy();
    expect(checkmarkB).toBeTruthy();
    expect(checkmarkC).toBeFalsy();
  });

  it('selects checkbox', () => {
    const testOption = mockOptions[1];

    const props = {
      ...baseProps,
      selected: [],
    };

    const { getByText } = render(<MultiSelect {...props} />);

    const activeOptionEl = getByText(testOption.label);

    fireEvent.press(activeOptionEl);

    expect(mockOnChange).toHaveBeenCalledWith([testOption]);
  });

  it('unselects checkbox', () => {
    const testOption = mockOptions[1];

    const props = {
      ...baseProps,
      selected: [testOption],
    };

    const { getByText } = render(<MultiSelect {...props} />);

    const activeOptionEl = getByText(testOption.label);

    fireEvent.press(activeOptionEl);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('selects All', () => {
    const props = {
      ...baseProps,
      selected: [],
      withSelectAll: true,
      selectAllLabel: 'Select All',
    };

    const { getByText } = render(<MultiSelect {...props} />);

    const selectAllOption = getByText('Select All');

    fireEvent.press(selectAllOption);

    expect(mockOnChange).toHaveBeenCalledWith(mockOptions);
  });

  it('unselects All', () => {
    const props = {
      ...baseProps,
      selected: mockOptions,
      withSelectAll: true,
      selectAllLabel: 'Select All',
    };

    const { getByText } = render(<MultiSelect {...props} />);

    const activeOptionEl = getByText('Select All');

    fireEvent.press(activeOptionEl);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('unselects single item', () => {
    const testOption = mockOptions[1];

    const props = {
      ...baseProps,
      selected: mockOptions,
      withSelectAll: true,
      selectAllLabel: 'Select All',
    };

    const { getByText } = render(<MultiSelect {...props} />);

    const activeOptionEl = getByText(testOption.label);

    fireEvent.press(activeOptionEl);

    expect(mockOnChange).toHaveBeenCalledWith([mockOptions[0], mockOptions[2]]);
  });

  it('filters options correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <MultiSelect
        {...baseProps}
        withFilter
        filterPlaceholder="Search options"
      />
    );

    const input = getByPlaceholderText('Search options');

    fireEvent.changeText(input, 'AB');

    expect(() => getByText('A')).toThrow();
    expect(getByText('Option AB')).toBeTruthy();
    expect(getByText('Option ABC')).toBeTruthy();
  });
});
