import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  Radio,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { Control, FieldValues } from 'react-hook-form';
import { View } from 'react-native';
import { PronounEnum } from '../apollo';
import { enumDisplayPronoun } from '../static/enumDisplayMapping';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends Array<infer U>
        ? `${K & string}[${number}]${'' | `.${NestedKeyOf<U>}`}`
        : `${K & string}${'' | `.${NestedKeyOf<T[K]>}`}`;
    }[keyof T]
  : '';

interface IPronounPickerProps<T extends FieldValues> {
  value: string | null | undefined;
  onPress: (e: PronounEnum) => void;
  control: Control<T>;
  otherName: NestedKeyOf<T>;
  withCard?: boolean;
  cardTitle?: boolean;
  title?: boolean;
  onReset?: () => void;
}

export default function PronounPicker<T extends FieldValues>(
  props: IPronounPickerProps<T>
) {
  const {
    value,
    onPress,
    otherName,
    control,
    withCard,
    cardTitle,
    title,
    onReset,
  } = props;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withCard) {
      return (
        <CardWrapper title={cardTitle ? 'Pronouns' : ''}>
          {children}
        </CardWrapper>
      );
    }
    return children;
  };

  return (
    <Wrapper>
      <View style={{ gap: Spacings.xs }}>
        {title && <TextRegular size="sm">Pronouns</TextRegular>}
        {Object.entries(enumDisplayPronoun).map(([enumValue, displayValue]) => (
          <Radio
            key={enumValue}
            value={value ? enumDisplayPronoun[value as PronounEnum] : ''}
            label={displayValue}
            onPress={() => onPress(enumValue as PronounEnum)}
            accessibilityHint={`Select ${displayValue}`}
          />
        ))}
        {value === PronounEnum.Other && (
          <Input
            mt="sm"
            label="Other Pronouns"
            placeholder="Enter Pronouns"
            name={otherName}
            control={control}
          />
        )}
        {onReset && (
          <View style={{ alignItems: 'flex-end' }}>
            <TextButton
              mt="sm"
              color={Colors.PRIMARY}
              title="Reset"
              accessibilityHint="resets pronouns"
              onPress={onReset}
            />
          </View>
        )}
      </View>
    </Wrapper>
  );
}
