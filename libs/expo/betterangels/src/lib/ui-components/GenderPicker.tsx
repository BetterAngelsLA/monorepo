import { Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  Radio,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { Control, FieldValues } from 'react-hook-form';
import { View } from 'react-native';
import { GenderEnum } from '../apollo';
import { enumDisplayGender } from '../static/enumDisplayMapping';

interface IGenderPickerProps<T extends FieldValues> {
  value: string | null | undefined;
  onPress: (e: GenderEnum) => void;
  control: Control<T>;
  otherName: Extract<keyof T, string>;
  withCard?: boolean;
  cardTitle?: string;
  title?: string;
}

export default function GenderPicker<T extends FieldValues>(
  props: IGenderPickerProps<T>
) {
  const { value, onPress, otherName, control, withCard, cardTitle, title } =
    props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return <CardWrapper title={cardTitle}>{children}</CardWrapper>;
    }
    return children;
  };

  return (
    <Wrapper>
      <View style={{ gap: Spacings.xs }}>
        {title && <TextRegular size="sm">Gender</TextRegular>}
        {Object.entries(enumDisplayGender).map(([enumValue, displayValue]) => (
          <Radio
            key={enumValue}
            value={value ? enumDisplayGender[value as GenderEnum] : ''}
            label={displayValue}
            onPress={() => onPress(enumValue as GenderEnum)}
            accessibilityHint={`Select ${displayValue}`}
          />
        ))}
        {value === GenderEnum.Other && (
          <Input
            mt="sm"
            label="Other Gender"
            placeholder="Enter Gender"
            name={otherName}
            control={control}
          />
        )}
      </View>
    </Wrapper>
  );
}
