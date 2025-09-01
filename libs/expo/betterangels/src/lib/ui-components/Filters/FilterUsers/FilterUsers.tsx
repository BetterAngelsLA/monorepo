import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { FilterUserOptions } from './FilterUserOptions';

type TProps = {
  label: string;
  meLabel?: string;
  onChange: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUsers(props: TProps) {
  const {
    label,
    meLabel,
    onChange,
    selected = [],
    title,
    searchPlaceholder,
    style,
  } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function onSelect(newSelected: TFilterOption[]) {
    onChange(newSelected);

    closeModalScreen();
  }

  function onFilterPress() {
    showModalScreen({
      presentation: 'modal',
      content: () => (
        <FilterUserOptions
          onSelected={onSelect}
          selected={selected}
          searchPlaceholder={searchPlaceholder}
          meLabel={meLabel}
        />
      ),
      title: title,
    });
  }

  return (
    <Filters.Button
      label={label}
      selected={selected.map((s) => s.label)}
      onPress={onFilterPress}
      labelMaxWidth={100}
      style={style}
    />
  );
}
