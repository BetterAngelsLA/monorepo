import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ICheckboxProps {
  label?: ReactNode;
  onCheck: (isChecked: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint: string;
  size?: 'sm' | 'md';
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
}

const SIZES = {
  sm: 16,
  md: 24,
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
    isChecked: initialChecked,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
  } = props;
  const [isChecked, setIsChecked] = useState(initialChecked || false);

  const toggleCheckbox = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onCheck(newState);
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessible
      style={[
        styles.container,
        {
          borderColor: hasBorder ? Colors.NEUTRAL_LIGHT : 'transparent',
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
      onPress={toggleCheckbox}
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
            {isChecked && <Text style={styles.checkboxLabel}>✓</Text>}
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
            {isChecked && <Text style={styles.checkboxLabel}>✓</Text>}
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
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 3,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  checked: {
    backgroundColor: Colors.PRIMARY_EXTRA_DARK,
  },
  checkboxLabel: {
    color: Colors.WHITE,
  },
  label: {
    fontSize: 16,
  },
});
