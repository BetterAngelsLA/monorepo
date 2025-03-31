import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { MultiSelect, TMultiSelect } from './MultiSelect';

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

type TOption = { id: string; label: string };

const baseProps: TMultiSelect<TOption> = {
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

  describe('with default checkbox', () => {
    const defaultProps = { ...baseProps };

    it('renders all options', () => {
      const { getByText } = render(<MultiSelect {...defaultProps} />);

      expect(getByText('Option A')).toBeTruthy();
      expect(getByText('Option AB')).toBeTruthy();
      expect(getByText('Option ABC')).toBeTruthy();
    });

    it('renders checked options as selected', () => {
      const props = {
        ...defaultProps,
        selected: [mockOptions[0], mockOptions[1]],
      };

      const { queryByTestId } = render(<MultiSelect {...props} />);

      const checkmarkA = queryByTestId('MultiSelect-option-0');
      const checkmarkB = queryByTestId('MultiSelect-option-1');
      const checkmarkC = queryByTestId('MultiSelect-option-2');

      expect(checkmarkA).toBeTruthy();
      expect(checkmarkB).toBeTruthy();
      expect(checkmarkC).toBeFalsy();
    });

    it('selects checkbox', () => {
      const testOption = mockOptions[1];

      const props = {
        ...defaultProps,
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
        ...defaultProps,
        selected: [testOption],
      };

      const { getByText } = render(<MultiSelect {...props} />);

      const activeOptionEl = getByText(testOption.label);

      fireEvent.press(activeOptionEl);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('selects All', () => {
      const props = {
        ...defaultProps,
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
        ...defaultProps,
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
        ...defaultProps,
        selected: mockOptions,
        withSelectAll: true,
        selectAllLabel: 'Select All',
      };

      const { getByText } = render(<MultiSelect {...props} />);

      const activeOptionEl = getByText(testOption.label);

      fireEvent.press(activeOptionEl);

      expect(mockOnChange).toHaveBeenCalledWith([
        mockOptions[0],
        mockOptions[2],
      ]);
    });

    it('filters options correctly', () => {
      const { getByPlaceholderText, getByText } = render(
        <MultiSelect
          {...defaultProps}
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

  describe('with custom option component', () => {
    const defaultProps = { ...baseProps };

    defaultProps.renderOption = (
      option,
      { isChecked, onClick, testId, accessibilityHint }
    ) => {
      return (
        <Pressable
          onPress={onClick}
          key={option.id}
          accessibilityHint={accessibilityHint}
          accessibilityLabel={accessibilityHint}
        >
          <Text testID={isChecked ? testId : undefined}>{option.label}</Text>
        </Pressable>
      );
    };

    it('renders all options', () => {
      const { getByText } = render(<MultiSelect {...defaultProps} />);

      expect(getByText('Option A')).toBeTruthy();
      expect(getByText('Option AB')).toBeTruthy();
      expect(getByText('Option ABC')).toBeTruthy();
    });

    it('renders checked options as selected', () => {
      const props = {
        ...defaultProps,
        selected: [mockOptions[0], mockOptions[1]],
      };

      const { queryByTestId } = render(<MultiSelect {...props} />);

      const checkmarkA = queryByTestId('MultiSelect-option-0');
      const checkmarkB = queryByTestId('MultiSelect-option-1');
      const checkmarkC = queryByTestId('MultiSelect-option-2');

      expect(checkmarkA).toBeTruthy();
      expect(checkmarkB).toBeTruthy();
      expect(checkmarkC).toBeFalsy();
    });

    it('selects checkbox', () => {
      const testOption = mockOptions[1];

      const props = {
        ...defaultProps,
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
        ...defaultProps,
        selected: [testOption],
      };

      const { getByText } = render(<MultiSelect {...props} />);

      const activeOptionEl = getByText(testOption.label);

      fireEvent.press(activeOptionEl);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });
});
