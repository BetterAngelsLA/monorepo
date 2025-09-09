import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { FilterClientOptions } from './FilterClientOptions';

type TProps = {
  buttonLabel: string;
  onChange: (filters: TFilterOption[]) => void;
  initialSelected?: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterClients(props: TProps) {
  const {
    buttonLabel,
    onChange,
    initialSelected = [],
    title,
    searchPlaceholder,
    style,
  } = props;

  const [selected, setSelected] = useState<TFilterOption[]>(initialSelected);
  const { showModalScreen, closeModalScreen } = useModalScreen();

  function showOptionsScreen() {
    showModalScreen({
      presentation: 'modal',
      content: () => (
        <FilterClientOptions
          initialSelected={selected}
          onCommit={(next: TFilterOption[]) => {
            setSelected(next);
            onChange(next);
            closeModalScreen();
          }}
          searchPlaceholder={searchPlaceholder}
        />
      ),
      title: title,
    });
  }

  return (
    <Filters.Button
      label={buttonLabel}
      selected={selected.map((s) => s.label)}
      onPress={showOptionsScreen}
      style={style}
    />
  );
}
