import {
  Filters,
  MultiSelect_V2,
  TFilterOption,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';

export type OptionScreenProps = {
  options: TFilterOption[];
  initialSelected: TFilterOption[];
  withLocalFilter?: boolean;
  withSelectAll?: boolean;
  searchPlaceholder?: string;
  valueKey?: keyof TFilterOption;
  labelKey?: keyof TFilterOption;
  onCommit: (selected: TFilterOption[]) => void;
};

export function OptionScreen({
  options,
  initialSelected,
  valueKey = 'id',
  labelKey = 'label',
  withLocalFilter,
  withSelectAll,
  searchPlaceholder,
  onCommit,
}: OptionScreenProps) {
  const [localSelected, setLocalSelected] =
    useState<TFilterOption[]>(initialSelected);

  const handleDone = () => {
    onCommit(localSelected);
  };

  return (
    <Filters.Screen onDone={handleDone} onClear={() => setLocalSelected([])}>
      <MultiSelect_V2<TFilterOption>
        options={options}
        selected={localSelected}
        onChange={setLocalSelected}
        valueKey={valueKey}
        labelKey={labelKey}
        withLocalFilter={withLocalFilter}
        withSelectAll={withSelectAll}
        searchPlaceholder={searchPlaceholder}
      />
    </Filters.Screen>
  );
}
