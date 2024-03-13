import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from './Themed';

type TVariants = {
  [key in 'primary' | 'secondary' | 'selected']: {
    bg: string;
    color: string;
    border: string;
  };
};

const VARIANTS: TVariants = {
  primary: {
    bg: '#FAF3D8',
    color: 'black',
    border: '#fff',
  },
  secondary: {
    bg: '#f7f7f7',
    color: '#696969',
    border: '#fff',
  },
  selected: {
    bg: '#f7f7f7',
    color: '#696969',
    border: '#e3e3ff',
  },
};

interface IButtonProps {
  title: string;
  variant: 'primary' | 'secondary' | 'selected';
  onPress?: () => void;
}

export default function Button(props: IButtonProps) {
  const { title, variant, onPress } = props;
  return (
    <View
      style={[
        styles.buttonContainer,
        {
          borderColor: VARIANTS[variant].border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        style={[
          styles.button,
          {
            backgroundColor: VARIANTS[variant].bg,

            marginBottom: 'auto',
          },
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.buttonLabel,
            {
              color: VARIANTS[variant].color,
            },
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderWidth: 4,
    borderRadius: 18,
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
