import { PawIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';
import BodyText from '../BodyText';
import { Checkbox } from './Checkbox';

describe('Checkbox Component', () => {
  it('renders with correct label', () => {
    const { getByText } = render(
      <Checkbox
        accessibilityHint=""
        label={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
            <BodyText ml="xs">Check Me</BodyText>
          </View>
        }
        onCheck={() => console.log('Checkbox checked')}
        isChecked={false}
      />
    );
    expect(getByText('Check Me')).toBeTruthy();
  });

  it('calls onCheck with true when unchecked and pressed', () => {
    const mockOnCheck = jest.fn();
    const { getByText } = render(
      <Checkbox
        accessibilityHint=""
        label={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
            <BodyText ml="xs">Check Me</BodyText>
          </View>
        }
        onCheck={mockOnCheck}
        isChecked={false}
      />
    );

    fireEvent.press(getByText('Check Me'));
    expect(mockOnCheck).toHaveBeenCalledWith(true);
  });

  it('calls onCheck with false when checked and pressed', () => {
    const mockOnCheck = jest.fn();
    const { getByText } = render(
      <Checkbox
        accessibilityHint=""
        label={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
            <BodyText ml="xs">Uncheck Me</BodyText>
          </View>
        }
        onCheck={mockOnCheck}
        isChecked={true}
      />
    );

    const checkboxLabel = getByText('Uncheck Me');
    fireEvent.press(checkboxLabel);
    fireEvent.press(checkboxLabel);

    expect(mockOnCheck).toHaveBeenCalledWith(false);
  });

  it('is accessible by role', () => {
    const { getByRole } = render(
      <Checkbox
        accessibilityHint=""
        label={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
            <BodyText ml="xs">Accessible Checkbox</BodyText>
          </View>
        }
        onCheck={() => console.log('Checkbox checked')}
        isChecked={false}
      />
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
