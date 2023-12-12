import { PlusIcon, XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
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

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function SearchableDropdown({
  extraTitle,
  label,
  data,
  setExternalValue,
  height = 56,
  disabled,
  placeholder,
  onExtraPress,
  mb,
  mt,
  my,
  mx,
  ml,
  mr,
  accessibilityHint,
}: {
  extraTitle?: string;
  label: string;
  data: string[];
  setExternalValue: (e: string) => void;
  height?: 56 | 40;
  disabled?: boolean;
  onExtraPress?: () => void;
  placeholder?: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  accessibilityHint: string;
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
    <View
      style={{
        ...containerStyle,
        marginBottom: mb && Spacings[mb],
        marginTop: mt && Spacings[mt],
        marginLeft: ml && Spacings[ml],
        marginRight: mr && Spacings[mr],
        marginHorizontal: mx && Spacings[mx],
        marginVertical: my && Spacings[my],
      }}
    >
      <BodyText mb="xs" size="sm">
        {label}
      </BodyText>
      <View style={styles.textInput}>
        <TextInput
          accessible
          accessibilityRole="search"
          style={{
            color: disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK,
            paddingLeft: Spacings.sm,
            paddingRight: 38,
            fontFamily: 'Poppins-Regular',
            fontSize: FontSizes.md.fontSize,
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
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityHint="deletes input's value"
            onPress={() => setValue('')}
            style={styles.icon}
          >
            <XmarkIcon color={Colors.PRIMARY_EXTRA_DARK} size="xs" />
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
              accessible
              accessibilityRole="button"
              accessibilityHint={`selects ${item}`}
              style={{ padding: Spacings.xs }}
              key={idx}
              onPress={() => handlePress(item)}
            >
              <BodyText>{item}</BodyText>
            </TouchableOpacity>
          ))}
          {extraTitle && (
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityHint={accessibilityHint}
              style={{
                padding: Spacings.xs,
                borderTopWidth: 1,
                borderTopColor: Colors.PRIMARY_EXTRA_DARK,
              }}
              onPress={onExtraPress}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
                <BodyText ml="xs">{extraTitle}</BodyText>
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
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    justifyContent: 'center',
  },
  dropdown: {
    width: '100%',
    maxHeight: DROPDOWN_MAX_HEIGHT,
    position: 'absolute',
    zIndex: 100,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.PRIMARY_EXTRA_DARK,
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
    backgroundColor: Colors.NEUTRAL_LIGHT,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
