import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

type TVariants = {
  [key in 'primary' | 'success' | 'warning']: {
    bg: string;
    border: string;
  };
};

const VARIANTS: TVariants = {
  primary: {
    bg: Colors.PRIMARY_EXTRA_LIGHT,
    border: Colors.PRIMARY_DARK,
  },
  success: {
    bg: Colors.SUCCESS_EXTRA_LIGHT,
    border: Colors.SUCCESS,
  },
  warning: {
    bg: Colors.WARNING_EXTRA_LIGHT,
    border: Colors.WARNING,
  },
};

interface IPillProps {
  variant: 'primary' | 'success' | 'warning';
  label: string;
}

export function Pill(props: IPillProps) {
  const { label, variant = 'success' } = props;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: VARIANTS[variant].bg,
          borderColor: VARIANTS[variant].border,
        },
      ]}
    >
      <TextRegular>{label}</TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radiuses.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: Spacings.xxs - 1,
    paddingHorizontal: Spacings.sm - 1,
  },
  success: {
    backgroundColor: Colors.SUCCESS_EXTRA_LIGHT,
  },
  primary: {
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    borderColor: Colors.PRIMARY_DARK,
  },
});
