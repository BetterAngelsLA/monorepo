import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Radio,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { RaceEnum } from '../apollo';
import { enumDisplayRace } from '../static/enumDisplayMapping';

interface IRacePickerProps {
  value: string | null | undefined;
  onPress: (e: RaceEnum) => void;
  withCard?: boolean;
  cardTitle?: boolean;
  title?: boolean;
  onReset?: () => void;
}

export default function RacePicker(props: IRacePickerProps) {
  const { value, onPress, withCard, cardTitle, title, onReset } = props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return (
        <CardWrapper title={cardTitle ? 'Race' : ''}>{children}</CardWrapper>
      );
    }
    return children;
  };

  return (
    <Wrapper>
      <View style={{ gap: Spacings.xs }}>
        {title && <TextRegular size="sm">Race</TextRegular>}
        {Object.entries(enumDisplayRace).map(([enumValue, displayValue]) => (
          <Radio
            key={enumValue}
            value={value ? enumDisplayRace[value as RaceEnum] : ''}
            label={displayValue}
            onPress={() => onPress(enumValue as RaceEnum)}
            accessibilityHint={`Select ${displayValue}`}
          />
        ))}
        {onReset && (
          <View style={{ alignItems: 'flex-end' }}>
            <TextButton
              mt="sm"
              color={Colors.PRIMARY}
              title="Reset"
              accessibilityHint="resets Race"
              onPress={onReset}
            />
          </View>
        )}
      </View>
    </Wrapper>
  );
}
