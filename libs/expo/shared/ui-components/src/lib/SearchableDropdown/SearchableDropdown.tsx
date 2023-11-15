import { PlusIcon, XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import BodyText from '../BodyText';

const MIN_FITABLE_HEIGHT = 300;
const DROPDOWN_MAX_HEIGHT = 150;

export function SearchableDropdown({
  extraTitle,
  label,
  data,
  setExternalValue,
  height = 56,
  disabled,
  placeholder,
  onExtraPress,
}: {
  extraTitle?: string;
  label: string;
  data: string[];
  setExternalValue: (e: string) => void;
  height?: 56 | 40;
  disabled?: boolean;
  onExtraPress?: () => void;
  placeholder?: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>(
    'bottom'
  );
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleBlur = () => {
    setShowDropdown(false);
  };

  const handleFocus = () => {
    setShowDropdown(true);
    if (inputRef.current) {
      inputRef.current.measure((fx, fy, width, height, px, py) => {
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
    Keyboard.dismiss();
  };

  const containerStyle: ViewStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
    ...(Platform.OS === 'ios' && showDropdown ? { zIndex: 10 } : null),
  };

  return (
    <View style={{ ...containerStyle }}>
      <BodyText mb={8} size="sm">
        {label}
      </BodyText>
      <View style={styles.textInput}>
        <TextInput
          style={{
            color: disabled ? Colors.GRAY : 'black',
            paddingLeft: 16,
            paddingRight: 38,
            height,
            ...Platform.select({
              web: {
                outline: 'none',
              },
            }),
          }}
          ref={inputRef}
          value={value}
          onChangeText={(e) => setValue(e)}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        {value && (
          <Pressable onPress={() => setValue('')} style={styles.icon}>
            <XmarkIcon color={Colors.DARK_BLUE} size="xs" />
          </Pressable>
        )}
      </View>

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
          {extraTitle && (
            <TouchableOpacity
              style={{
                padding: 8,
                borderTopWidth: 1,
                borderTopColor: Colors.DARK_BLUE,
              }}
              onPress={onExtraPress}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <PlusIcon color={Colors.DARK_BLUE} size="sm" />
                <BodyText ml={10}>{extraTitle}</BodyText>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    position: 'relative',
    fontFamily: 'Pragmatica-book',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: Colors.DARK_BLUE,
    justifyContent: 'center',
  },
  dropdown: {
    width: '100%',
    maxHeight: DROPDOWN_MAX_HEIGHT,
    position: 'absolute',
    zIndex: 100,
    borderWidth: 1,
    borderColor: Colors.DARK_BLUE,
    backgroundColor: Colors.WHITE,
  },
  dropdownTop: {
    bottom: '110%',
  },
  dropdownBottom: {
    top: '110%',
  },
  icon: {
    position: 'absolute',
    right: 16,
    height: 16,
    width: 16,
    backgroundColor: Colors.GRAY,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
