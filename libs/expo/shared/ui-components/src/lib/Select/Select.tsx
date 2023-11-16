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

interface ISelectProps {
  data: string[];
  setExternalValue: (e: string) => void;
  mb?: number;
  mt?: number;
  my?: number;
  mx?: number;
  ml?: number;
  mr?: number;
  label?: string;
  placeholder?: string;
}

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
          marginBottom: mb,
          marginTop: mt,
          marginLeft: ml,
          marginRight: mr,
          marginHorizontal: mx,
          marginVertical: my,
        },
      ]}
    >
      {label && (
        <BodyText mb={8} size="sm">
          {label}
        </BodyText>
      )}
      <Pressable onPress={handleDropdown}>
        <View style={styles.select} ref={buttonRef}>
          <BodyText>{value ? value : placeholder}</BodyText>
          <View style={styles.icon}>
            <ChevronLeftIcon
              rotate={showDropdown ? '90deg' : '-90deg'}
              color={Colors.DARK_BLUE}
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
    borderColor: Colors.DARK_BLUE,
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
    borderColor: Colors.DARK_BLUE,
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
