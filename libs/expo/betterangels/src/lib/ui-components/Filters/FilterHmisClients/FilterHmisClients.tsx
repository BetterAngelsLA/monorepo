import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { FilterHmisClientOptions } from './FilterHmisClientOptions';

type TProps = {
  buttonLabel: string;
  onChange: (filters: TFilterOption[]) => void;
  initialSelected?: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterHmisClients(props: TProps) {
  const {
    buttonLabel,
    onChange,
    initialSelected = [],
    title,
    searchPlaceholder,
    style,
  } = props;

  const [selected, setSelected] = useState<TFilterOption[]>(initialSelected);
  const { showModalScreen } = useModalScreen();

  function showOptionsScreen() {
    showModalScreen({
      presentation: 'modal',
      renderContent: ({ close }) => (
        <FilterHmisClientOptions
          initialSelected={selected}
          onCommit={(next: TFilterOption[]) => {
            setSelected(next);
            onChange(next);
            close();
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
