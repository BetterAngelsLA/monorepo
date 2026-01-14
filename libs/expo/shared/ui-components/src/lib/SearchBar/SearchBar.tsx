import { Spacings } from '@monorepo/expo/shared/static';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  SearchBarActionButton,
  TSearchBarActionButton,
} from './SearchBarActionButton';
import { SearchBarSlot } from './SearchBarSlot';
import { SearchInput, TSearchInput } from './SearchInput';

type TSearchBar = {
  style?: StyleProp<ViewStyle>;
  actionSlotRight?: TSearchBarActionButton;
} & TSearchInput;

export function SearchBar(props: TSearchBar) {
  const { style, actionSlotRight, ...inputProps } = props;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputSlot}>
        <SearchInput {...inputProps} />
      </View>

      {actionSlotRight && (
        <SearchBarSlot style={[actionSlotRight.slotStyle]}>
          <SearchBarActionButton {...actionSlotRight} />
        </SearchBarSlot>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  inputSlot: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
