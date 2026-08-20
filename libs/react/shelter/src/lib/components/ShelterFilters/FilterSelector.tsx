import {
  CheckboxGroup,
  ExpandableContainer,
} from '@monorepo/react/components';
import { ChevronLeftIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useId, useMemo, useState } from 'react';
import {
  TFilterConfig,
  TFilterOptionType,
  TShelterFilterOption,
} from './config';

type IProps = {
  className?: string;
  header: string;
  name: TFilterConfig['name'];
  options: TShelterFilterOption[];
  values?: TFilterOptionType[] | null;
  expanded?: boolean;
  onChange: (
    name: TFilterConfig['name'],
    selected: string[],
  ) => void;
};

const VISIBLE_ROW_COUNT = 7;
const SELECT_ALL_ROW_COUNT = 1;
const VISIBLE_OPTION_COUNT =
  VISIBLE_ROW_COUNT - SELECT_ALL_ROW_COUNT;

function useFilterOptions(
  options: TShelterFilterOption[],
  values: TFilterOptionType[] | null | undefined,
  visibleOptionCount = VISIBLE_OPTION_COUNT,
) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const normalizedValues = useMemo(
    () => (values ?? []).map(String),
    [values],
  );

  const sortedOptions = useMemo(
    () =>
      [...options].sort((first, second) =>
        first.label.localeCompare(second.label, undefined, {
          sensitivity: 'base',
        }),
      ),
    [options],
  );

  const hasAdditionalOptions =
    sortedOptions.length > visibleOptionCount;

  const visibleOptions = useMemo(
    () =>
      showMoreOptions
        ? sortedOptions
        : sortedOptions.slice(0, visibleOptionCount),
    [showMoreOptions, sortedOptions, visibleOptionCount],
  );

  const visibleValueSet = useMemo(
    () =>
      new Set(
        visibleOptions.map((option) => String(option.value)),
      ),
    [visibleOptions],
  );

  function getMergedSelection(
    selectedVisible: string[],
  ): string[] {
    const hiddenSelectedValues = normalizedValues.filter(
      (value) => !visibleValueSet.has(value),
    );

    return [...hiddenSelectedValues, ...selectedVisible];
  }

  return {
    showMoreOptions,
    setShowMoreOptions,
    visibleOptions,
    normalizedValues,
    hasAdditionalOptions,
    getMergedSelection,
  };
}

export function FilterSelector(props: IProps) {
  const {
    header,
    name,
    options,
    values,
    expanded,
    onChange,
    className,
  } = props;

  const optionsId = useId();

  const {
    showMoreOptions,
    setShowMoreOptions,
    visibleOptions,
    normalizedValues,
    hasAdditionalOptions,
    getMergedSelection,
  } = useFilterOptions(options, values);

  function handleOptionsChange(selectedVisible: string[]) {
    onChange(
      name,
      getMergedSelection(selectedVisible),
    );
  }

  return (
    <div className={className}>
      <ExpandableContainer
        header={header}
        open={!!expanded}
      >
        <div id={optionsId}>
          <CheckboxGroup
            options={visibleOptions}
            values={normalizedValues}
            onChange={handleOptionsChange}
            selectAll="Select All"
          />
        </div>

        {hasAdditionalOptions && (
          <button
            type="button"
            className="mt-8 flex w-full items-center justify-end gap-2 text-primary-20"
            aria-expanded={showMoreOptions}
            aria-controls={optionsId}
            onClick={() =>
              setShowMoreOptions((current) => !current)
            }
          >
            <span>
              {showMoreOptions
                ? 'Show Less Options'
                : 'Show More Options'}
            </span>

            <ChevronLeftIcon
              className={mergeCss([
                'w-3',
                showMoreOptions
                  ? 'rotate-90'
                  : '-rotate-90',
                'text-primary-20',
                'transition-transform',
              ])}
            />
          </button>
        )}
      </ExpandableContainer>
    </div>
  );
}
