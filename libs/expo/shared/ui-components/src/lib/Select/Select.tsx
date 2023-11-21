import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import BodyText from '../BodyText';

const MIN_FITABLE_HEIGHT = 300;
const DROPDOWN_MAX_HEIGHT = 150;

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ISelectProps {
  data: string[];
  setExternalValue: (e: string) => void;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  label?: string;
  placeholder?: string;
}

const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

export function Select(props: ISelectProps) {
  const { setExternalValue, data, mb, mt, mr, ml, my, mx, label, placeholder } =
    props;
  const [value, setValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const buttonRef = useRef<View>(null);

  const handleDropdown = () => {
    setShowDropdown(true);
    if (buttonRef.current) {
      buttonRef.current?.measure((fx, fy, width, height, px, py) => {
        const screenHeight = Dimensions.get('window').height;
        const bottomSpace = screenHeight - (py + height);
        if (bottomSpace < MIN_FITABLE_HEIGHT) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      });
    }
  };

  const handlePress = (newValue: string) => {
    setValue(newValue);
    setExternalValue(newValue);
    setShowDropdown(false);
  };

  const containerStyle: ViewStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
    ...(Platform.OS === 'ios' && showDropdown ? { zIndex: 10 } : null),
  };

  return (
    <View
      style={[
        containerStyle,
        {
          marginBottom: mb && SPACING[mb],
          marginTop: mt && SPACING[mt],
          marginLeft: ml && SPACING[ml],
          marginRight: mr && SPACING[mr],
          marginHorizontal: mx && SPACING[mx],
          marginVertical: my && SPACING[my],
        },
      ]}
    >
      {label && (
        <BodyText mb="xs" size="sm">
          {label}
        </BodyText>
      )}
      <Pressable onPress={handleDropdown}>
        <View style={styles.select} ref={buttonRef}>
          <BodyText>{value ? value : placeholder}</BodyText>
          <View style={styles.icon}>
            <ChevronLeftIcon
              rotate={showDropdown ? '90deg' : '-90deg'}
              color={Colors.PRIMARY_EXTRA_DARK}
            />
          </View>
        </View>
      </Pressable>
      {showDropdown && (
        <ScrollView
          contentContainerStyle={{ padding: 8 }}
          keyboardShouldPersistTaps="handled"
          style={[
            styles.dropdown,
            dropdownPosition === 'top'
              ? styles.dropdownTop
              : styles.dropdownBottom,
          ]}
        >
          {data.map((item, idx) => (
            <TouchableOpacity
              style={{ padding: 8 }}
              key={idx}
              onPress={() => handlePress(item)}
            >
              <BodyText>{item}</BodyText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  select: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 38,
    height: 56,
  },
  dropdown: {
    width: '100%',
    maxHeight: DROPDOWN_MAX_HEIGHT,
    position: 'absolute',
    zIndex: 100,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    backgroundColor: Colors.WHITE,
  },
  dropdownTop: {
    bottom: '102%',
  },
  dropdownBottom: {
    top: '102%',
  },
  icon: {
    position: 'absolute',
    right: 20,
  },
});
