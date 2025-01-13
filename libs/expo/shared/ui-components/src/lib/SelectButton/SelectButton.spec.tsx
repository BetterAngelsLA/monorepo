import { fireEvent, render } from '@testing-library/react-native';
import { SelectButton } from './SelectButton';

describe('SelectButton Component', () => {
  it('renders with default label when no selection is made', () => {
    const { getByText } = render(
      <SelectButton selected={[]} onPress={jest.fn()} />
    );

    expect(getByText('All')).toBeTruthy();
  });

  it('renders with a single selected item', () => {
    const { getByText } = render(
      <SelectButton
        defaultLabel="All"
        selected={['Team A']}
        onPress={jest.fn()}
      />
    );

    expect(getByText('Team A')).toBeTruthy();
  });

  it('renders with multiple selected items', () => {
    const { getByText } = render(
      <SelectButton
        defaultLabel="All"
        selected={['Team A', 'Team B', 'Team C']}
        onPress={jest.fn()}
      />
    );

    expect(getByText('Team A + (2)')).toBeTruthy();
  });

  it('renders with "All" selected', () => {
    const { getByText } = render(
      <SelectButton defaultLabel="All" selected={['All']} onPress={jest.fn()} />
    );

    expect(getByText('All')).toBeTruthy();
  });

  it('triggers onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <SelectButton defaultLabel="All" selected={[]} onPress={mockOnPress} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
