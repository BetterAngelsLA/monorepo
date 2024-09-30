import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Radio,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { HairColorEnum } from '../apollo';
import { enumDisplayHairColor } from '../static/enumDisplayMapping';

interface IHairColorPickerProps {
  value: string | null | undefined;
  onPress: (e: HairColorEnum) => void;
  withCard?: boolean;
  cardTitle?: boolean;
  title?: boolean;
  onReset?: () => void;
}

export default function HairColorPicker(props: IHairColorPickerProps) {
  const { value, onPress, withCard, cardTitle, title, onReset } = props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return (
        <CardWrapper title={cardTitle ? 'Hair Color' : ''}>
          {children}
        </CardWrapper>
      );
    }
    return children;
  };

  return (
    <Wrapper>
      <View style={{ gap: Spacings.xs }}>
        {title && <TextRegular size="sm">Hair Color</TextRegular>}
        {Object.entries(enumDisplayHairColor).map(
          ([enumValue, displayValue]) => (
            <Radio
              key={enumValue}
              value={value ? enumDisplayHairColor[value as HairColorEnum] : ''}
              label={displayValue}
              onPress={() => onPress(enumValue as HairColorEnum)}
              accessibilityHint={`Select ${displayValue}`}
            />
          )
        )}
        {onReset && (
          <View style={{ alignItems: 'flex-end' }}>
            <TextButton
              mt="sm"
              color={Colors.PRIMARY}
              title="Reset"
              accessibilityHint="resets Hair Color"
              onPress={onReset}
            />
          </View>
        )}
      </View>
    </Wrapper>
  );
}
