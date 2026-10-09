import { CheckboxGroup, ExpandableContainer } from '@monorepo/react/components';
import { useId } from 'react';
import { ShowMoreToggle } from './ShowMoreToggle';
import {
  TFilterConfig,
  TFilterOptionType,
  TShelterFilterOption,
} from './config';
import { useFilterOptions } from './useFilterOptions';

type IProps = {
  className?: string;
  header: string;
  name: TFilterConfig['name'];
  options: TShelterFilterOption[];
  values?: TFilterOptionType[] | null;
  expanded?: boolean;
  onChange: (name: TFilterConfig['name'], selected: string[]) => void;
};

export function FilterSelector(props: IProps) {
  const { header, name, options, values, expanded, onChange, className } =
    props;

  const optionsId = useId();

  const {
    showMoreOptions,
    setShowMoreOptions,
    visibleOptions,
    visibleValues,
    allOptionValues,
    hasAdditionalOptions,
    getMergedSelection,
  } = useFilterOptions(options, values);

  function handleOptionsChange(selectedVisible: string[]) {
    onChange(name, getMergedSelection(selectedVisible));
  }

  const selectedValues = new Set((values ?? []).map(String));
  const allOptionsSelected =
    allOptionValues.length > 0 &&
    allOptionValues.every((value) => selectedValues.has(value));

  return (
    <div className={className}>
      <ExpandableContainer header={header} open={!!expanded}>
        <div id={optionsId}>
          <CheckboxGroup
            options={visibleOptions}
            values={visibleValues}
            onChange={handleOptionsChange}
            selectAll="Select All"
            selectAllChecked={allOptionsSelected}
            onSelectAllChange={(checked) =>
              onChange(name, checked ? allOptionValues : [])
            }
          />
        </div>

        {hasAdditionalOptions && (
          <ShowMoreToggle
            expanded={showMoreOptions}
            moreLabel="Show More Options"
            lessLabel="Show Less Options"
            controls={optionsId}
            onClick={() => setShowMoreOptions((current) => !current)}
          />
        )}
      </ExpandableContainer>
    </div>
  );
}
