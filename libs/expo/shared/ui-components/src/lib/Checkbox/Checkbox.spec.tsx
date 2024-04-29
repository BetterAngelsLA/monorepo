import { PawIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';
import TextRegular from '../TextRegular';
import { Checkbox } from './Checkbox';

describe('Checkbox Component', () => {
  it('renders with correct label', () => {
    const { getByText } = render(
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
      />
    );
    expect(getByText('Check Me')).toBeTruthy();
  });

  it('calls onCheck when pressed', () => {
    const mockOnCheck = jest.fn();
    const { getByText } = render(
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
      />
    );

    fireEvent.press(getByText('Check Me'));
    expect(mockOnCheck).toHaveBeenCalled();
  });

  it('is accessible by role', () => {
    const { getByRole } = render(
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
      />
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
