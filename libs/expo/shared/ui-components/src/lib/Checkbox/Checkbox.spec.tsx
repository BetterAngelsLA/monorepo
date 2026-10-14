import { PawIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';
import TextRegular from '../TextRegular';
import { Checkbox } from './Checkbox';

describe('Checkbox Component', () => {
  it('renders with correct label', async () => {
    const { getByText } = await render(
      <Checkbox
        accessibilityHint=""
        label={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
            <TextRegular ml="xs">Check Me</TextRegular>
          </View>
        }
        onCheck={() => console.log('Checkbox checked')}
        isChecked={false}
      />,
    );
    expect(getByText('Check Me')).toBeTruthy();
  });

  it('calls onCheck when pressed', async () => {
    const mockOnCheck = vi.fn();
    const { getByText } = await render(
      <Checkbox
        accessibilityHint=""
        label={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
            <TextRegular ml="xs">Check Me</TextRegular>
          </View>
        }
        onCheck={mockOnCheck}
        isChecked={false}
      />,
    );

    await fireEvent.press(getByText('Check Me'));
    expect(mockOnCheck).toHaveBeenCalled();
  });

  it('is accessible by role', async () => {
    const { getByRole } = await render(
      <Checkbox
        accessibilityHint=""
        label={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
            <TextRegular ml="xs">Accessible Checkbox</TextRegular>
          </View>
        }
        onCheck={() => console.log('Checkbox checked')}
        isChecked={false}
      />,
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('honours an explicit checkbox role for labels containing their own controls', async () => {
    const { getByRole } = await render(
      <Checkbox
        accessibilityHint=""
        accessibilityRole="checkbox"
        label={<TextRegular ml="xs">I accept the Terms of Service</TextRegular>}
        onCheck={() => console.log('Checkbox checked')}
        isChecked={false}
      />,
    );
    expect(getByRole('checkbox')).toBeTruthy();
    // The checked state has to travel with the role. This pins `isChecked`
    // reaching the tree as accessibility state; the web half is the
    // `aria-checked` prop beside it, because react-native-web drops
    // `accessibilityState` and this renderer cannot observe the DOM.
    expect(getByRole('checkbox', { checked: false })).toBeTruthy();
  });
});
