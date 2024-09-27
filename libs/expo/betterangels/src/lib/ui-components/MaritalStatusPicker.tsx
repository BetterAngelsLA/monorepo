import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Radio,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { MaritalStatusEnum } from '../apollo';
import { enumDisplayMaritalStatus } from '../static/enumDisplayMapping';

interface IMaritalStatusPickerProps {
  value: string | null | undefined;
  onPress: (e: MaritalStatusEnum) => void;
  withCard?: boolean;
  cardTitle?: boolean;
  title?: boolean;
  onReset?: () => void;
}

export default function MaritalStatusPicker(props: IMaritalStatusPickerProps) {
  const { value, onPress, withCard, cardTitle, title, onReset } = props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return (
        <CardWrapper title={cardTitle ? 'Marital Status' : ''}>
          {children}
        </CardWrapper>
      );
    }
    return children;
  };

  return (
    <Wrapper>
      <View style={{ gap: Spacings.xs }}>
        {title && <TextRegular size="sm">Marital Status</TextRegular>}
        {Object.entries(enumDisplayMaritalStatus).map(
          ([enumValue, displayValue]) => (
            <Radio
              key={enumValue}
              value={
                value
                  ? enumDisplayMaritalStatus[value as MaritalStatusEnum]
                  : ''
              }
              label={displayValue}
              onPress={() => onPress(enumValue as MaritalStatusEnum)}
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
              accessibilityHint="resets Marital Status"
              onPress={onReset}
            />
          </View>
        )}
      </View>
    </Wrapper>
  );
}
