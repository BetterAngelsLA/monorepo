import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { OptionScreen, OptionScreenProps } from './OptionScreen';

type TProps = {
  buttonLabel: string;
  onChange: (filters: TFilterOption[]) => void;
  initialSelected?: TFilterOption[];
  title?: string;
  style?: StyleProp<ViewStyle>;
} & Omit<OptionScreenProps, 'initialSelected' | 'onCommit'>;

export function FilterStatic(props: TProps) {
  const {
    buttonLabel,
    initialSelected = [],
    onChange,
    title,
    style,
    ...rest
  } = props;

  const [selected, setSelected] = useState<TFilterOption[]>(initialSelected);
  const { showModalScreen, closeModalScreen } = useModalScreen();

  function showOptionScreen() {
    showModalScreen({
      presentation: 'modal',
      title,
      content: (
        <OptionScreen
          initialSelected={selected}
          onCommit={(next: TFilterOption[]) => {
            setSelected(next);
            onChange(next);
            closeModalScreen();
          }}
          {...rest}
        />
      ),
    });
  }

  return (
    <Filters.Button
      label={buttonLabel}
      selected={selected.map((s) => s.label)}
      onPress={showOptionScreen}
      style={style}
    />
  );
}
