import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { FilterUserOptions } from './FilterUserOptions';

type TProps = {
  buttonLabel: string;
  currentUserId?: string;
  currentUserLabel?: string;
  onChange: (filters: TFilterOption[]) => void;
  initialSelected?: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUsers(props: TProps) {
  const {
    buttonLabel,
    currentUserId,
    currentUserLabel = 'Me',
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
        <FilterUserOptions
          initialSelected={selected}
          onCommit={(next: TFilterOption[]) => {
            setSelected(next);
            onChange(next);
            close();
          }}
          searchPlaceholder={searchPlaceholder}
          currentUserLabel={currentUserLabel}
          currentUserId={currentUserId}
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
