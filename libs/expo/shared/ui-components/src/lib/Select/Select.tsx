import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
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
import TextRegular from '../TextRegular';

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
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
    >
      {label && (
        <TextRegular mb="xs" size="sm">
          {label}
        </TextRegular>
      )}
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityHint="opens dropdown"
        onPress={handleDropdown}
      >
        <View style={styles.select} ref={buttonRef}>
          <TextRegular>{value ? value : placeholder}</TextRegular>
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
          contentContainerStyle={{ padding: Spacings.xs }}
          keyboardShouldPersistTaps="handled"
          style={[
            styles.dropdown,
            dropdownPosition === 'top'
              ? styles.dropdownTop
              : styles.dropdownBottom,
          ]}
          testID="select-dropdown"
        >
          {data.map((item, idx) => (
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityHint={'selects ${item} from opened dropdown'}
              style={{ padding: Spacings.xs }}
              key={idx}
              onPress={() => handlePress(item)}
            >
              <TextRegular>{item}</TextRegular>
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
    borderRadius: 8,
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    justifyContent: 'center',
    paddingLeft: Spacings.sm,
    paddingRight: 38,
    height: 56,
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
