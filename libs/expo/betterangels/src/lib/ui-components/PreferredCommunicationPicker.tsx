import { PawIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Checkbox,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { PreferredCommunicationEnum } from '../apollo';
import { enumDisplayPreferredCommunication } from '../static/enumDisplayMapping';

interface IPreferredCommunicationPickerProps {
  onPress: (e: PreferredCommunicationEnum) => void;
  withCard?: boolean;
  cardTitle?: boolean;
  title?: boolean;
  onReset?: () => void;
  selected: PreferredCommunicationEnum[];
}

const icons = {
  [PreferredCommunicationEnum.Call]: (
    <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Email]: (
    <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Facebook]: (
    <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Instagram]: (
    <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Linkedin]: (
    <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Text]: (
    <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Whatsapp]: (
    <PawIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
};

export default function PreferredCommunicationPicker(
  props: IPreferredCommunicationPickerProps
) {
  const { onPress, withCard, cardTitle, title, onReset, selected } = props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return (
        <CardWrapper title={cardTitle ? 'Preferred Communication' : ''}>
          {children}
        </CardWrapper>
      );
    }
    return children;
  };

  return (
    <Wrapper>
      <View style={{ gap: Spacings.xs }}>
        {title && <TextRegular size="sm">PreferredCommunications</TextRegular>}
        {Object.entries(enumDisplayPreferredCommunication).map(
          ([enumValue, displayValue]) => (
            <Checkbox
              key={enumValue}
              isChecked={selected.includes(
                enumValue as PreferredCommunicationEnum
              )}
              hasBorder
              onCheck={() => onPress(enumValue as PreferredCommunicationEnum)}
              accessibilityHint={`Select ${displayValue}`}
              label={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {icons[enumValue as PreferredCommunicationEnum]}
                  <TextRegular ml="xs">{displayValue}</TextRegular>
                </View>
              }
            />
          )
        )}
        {onReset && (
          <View style={{ alignItems: 'flex-end' }}>
            <TextButton
              mt="sm"
              color={Colors.PRIMARY}
              title="Reset"
              accessibilityHint="resets Preferred Communication"
              onPress={onReset}
            />
          </View>
        )}
      </View>
    </Wrapper>
  );
}
