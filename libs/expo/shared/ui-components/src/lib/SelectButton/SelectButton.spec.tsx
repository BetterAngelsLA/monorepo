import { fireEvent, render } from '@testing-library/react-native';
import { SelectButton } from './SelectButton';

describe('SelectButton Component', () => {
  it('renders with default label when no selection is made', async () => {
    const { getByText } = await render(
      <SelectButton selected={[]} onPress={vi.fn()} />,
    );

    expect(getByText('All')).toBeTruthy();
  });

  it('renders with a single selected item', async () => {
    const { getByText } = await render(
      <SelectButton
        defaultLabel="All"
        selected={['Team A']}
        onPress={vi.fn()}
      />,
    );

    expect(getByText('Team A')).toBeTruthy();
  });

  it('renders with multiple selected items', async () => {
    const { getByText } = await render(
      <SelectButton
        defaultLabel="All"
        selected={['Team A', 'Team B', 'Team C']}
        onPress={vi.fn()}
      />,
    );

    expect(getByText('Team A + (2)')).toBeTruthy();
  });

  it('renders with "All" selected', async () => {
    const { getByText } = await render(
      <SelectButton defaultLabel="All" selected={['All']} onPress={vi.fn()} />,
    );

    expect(getByText('All')).toBeTruthy();
  });

  it('triggers onPress when pressed', async () => {
    const mockOnPress = vi.fn();
    const { getByRole } = await render(
      <SelectButton defaultLabel="All" selected={[]} onPress={mockOnPress} />,
    );

    const button = getByRole('button');
    await fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
