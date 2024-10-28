import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Checkbox,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { AdaAccommodationEnum } from '../apollo';
import { enumDisplayAdaAccommodationEnum } from '../static/enumDisplayMapping';

interface IAdaAccommodationPicker {
  onPress: (e: AdaAccommodationEnum) => void;
  withCard?: boolean;
  cardTitle?: boolean;
  title?: boolean;
  onReset?: () => void;
  selected: AdaAccommodationEnum[];
}

export default function AdaAccommodationPicker(props: IAdaAccommodationPicker) {
  const { onPress, withCard, cardTitle, title, onReset, selected } = props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return (
        <CardWrapper title={cardTitle ? 'ADA Accommodation' : ''}>
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
        {Object.entries(enumDisplayAdaAccommodationEnum).map(
          ([enumValue, displayValue]) => (
            <Checkbox
              key={enumValue}
              isChecked={selected.includes(enumValue as AdaAccommodationEnum)}
              hasBorder
              onCheck={() => onPress(enumValue as AdaAccommodationEnum)}
              accessibilityHint={`Select ${displayValue}`}
              label={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              accessibilityHint="resets ADA Accommodation"
              onPress={onReset}
            />
          </View>
        )}
      </View>
    </Wrapper>
  );
}
