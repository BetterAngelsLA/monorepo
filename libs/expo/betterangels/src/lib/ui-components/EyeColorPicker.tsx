import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Radio,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { EyeColorEnum } from '../apollo';
import { enumDisplayEyeColor } from '../static/enumDisplayMapping';

interface IEyeColorPickerProps {
  value: string | null | undefined;
  onPress: (e: EyeColorEnum) => void;
  withCard?: boolean;
  cardTitle?: boolean;
  title?: boolean;
  onReset?: () => void;
}

export default function EyeColorPicker(props: IEyeColorPickerProps) {
  const { value, onPress, withCard, cardTitle, title, onReset } = props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return (
        <CardWrapper title={cardTitle ? 'Eye Color' : ''}>
          {children}
        </CardWrapper>
      );
    }
    return children;
  };

  return (
    <Wrapper>
      <View style={{ gap: Spacings.xs }}>
        {title && <TextRegular size="sm">Eye Color</TextRegular>}
        {Object.entries(enumDisplayEyeColor).map(
          ([enumValue, displayValue]) => (
            <Radio
              key={enumValue}
              value={value ? enumDisplayEyeColor[value as EyeColorEnum] : ''}
              label={displayValue}
              onPress={() => onPress(enumValue as EyeColorEnum)}
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
              accessibilityHint="resets Eye Color"
              onPress={onReset}
            />
          </View>
        )}
      </View>
    </Wrapper>
  );
}
