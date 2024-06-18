import { CheckIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { DimensionValue, Pressable, StyleSheet, View } from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ICheckboxProps {
  label?: ReactNode;
  onCheck: () => void;
  accessibilityLabel?: string;
  accessibilityHint: string;
  size?: 'sm' | 'md' | 'lg';
  hasBorder?: boolean;
  labelFirst?: boolean;
  justifyContent?: 'flex-start' | 'space-between';
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  isChecked: boolean;
  height?: DimensionValue | undefined;
}

const SIZES = {
  sm: 16,
  md: 24,
  lg: 32,
} as const;

export function Checkbox(props: ICheckboxProps) {
  const {
    label,
    onCheck,
    accessibilityHint,
    accessibilityLabel,
    size = 'md',
    hasBorder,
    labelFirst = true,
    justifyContent = 'space-between',
    isChecked,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    height,
  } = props;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessible
      style={[
        styles.container,
        {
          height,
          borderColor: hasBorder ? Colors.NEUTRAL_LIGHT : 'transparent',
          backgroundColor: isChecked
            ? Colors.PRIMARY_EXTRA_LIGHT
            : Colors.WHITE,
          paddingHorizontal: hasBorder ? Spacings.sm : 0,
          paddingVertical: hasBorder ? Spacings.xs : 0,
          justifyContent,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
      onPress={onCheck}
    >
      {labelFirst ? (
        <>
          {label}
          <View
            style={[
              styles.checkbox,
              isChecked && styles.checked,
              {
                height: SIZES[size],
                width: SIZES[size],
              },
            ]}
          >
            {isChecked && <CheckIcon />}
          </View>
        </>
      ) : (
        <>
          <View
            style={[
              styles.checkbox,
              isChecked && styles.checked,
              {
                height: SIZES[size],
                width: SIZES[size],
              },
            ]}
          >
            {isChecked && <CheckIcon />}
          </View>
          {label}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 3,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  checked: {
    backgroundColor: Colors.PRIMARY_EXTRA_DARK,
  },
  label: {
    fontSize: 16,
  },
});
