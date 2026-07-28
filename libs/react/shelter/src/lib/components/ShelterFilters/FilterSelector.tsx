import {
  Checkbox,
  ExpandableContainer,
} from '@monorepo/react/components';
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

const INITIAL_VISIBLE_OPTION_COUNT = 7;

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

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const generatedId = useId();

  const selectedValues = values ?? [];

  /*
   * Clone before sorting so the original config array is not mutated.
   * All options are alphabetized with no priority grouping.
   */
  const sortedOptions = useMemo(
    () =>
      [...options].sort((first, second) =>
        first.label.localeCompare(second.label, undefined, {
          sensitivity: 'base',
          numeric: true,
        }),
      ),
    [options],
  );

  const hasMoreOptions =
    sortedOptions.length > INITIAL_VISIBLE_OPTION_COUNT;

  const visibleOptions = showMoreOptions
    ? sortedOptions
    : sortedOptions.slice(0, INITIAL_VISIBLE_OPTION_COUNT);

  const allOptionValues = useMemo(
    () => sortedOptions.map((option) => option.value),
    [sortedOptions],
  );

  const allOptionsSelected =
    allOptionValues.length > 0 &&
    allOptionValues.every((value) =>
      selectedValues.includes(value),
    );

  const additionalOptionsId = `${generatedId}-additional-options`;

  function handleOptionChange(
    optionValue: TFilterOptionType,
    checked: boolean,
  ) {
    const nextValues = checked
      ? Array.from(new Set([...selectedValues, optionValue]))
      : selectedValues.filter(
          (selectedValue) => selectedValue !== optionValue,
        );

    onChange(name, nextValues);
  }

  function handleSelectAllChange(checked: boolean) {
    onChange(name, checked ? allOptionValues : []);
  }

  return (
    <div className={className}>
      <ExpandableContainer header={header} open={!!expanded}>
        <div className="flex flex-col gap-2">
          {/* Select All does not count toward the seven-option limit. */}
          <Checkbox
            label="Select All"
            checked={allOptionsSelected}
            onChange={handleSelectAllChange}
          />

          {visibleOptions.map((option, index) => {
            const isAdditionalOption =
              index >= INITIAL_VISIBLE_OPTION_COUNT;

            return (
              <div
                key={option.value}
                id={
                  isAdditionalOption && index === INITIAL_VISIBLE_OPTION_COUNT
                    ? additionalOptionsId
                    : undefined
                }
              >
                <Checkbox
                  label={option.label}
                  checked={selectedValues.includes(option.value)}
                  onChange={(checked) =>
                    handleOptionChange(option.value, checked)
                  }
                />
              </div>
            );
          })}

          {hasMoreOptions && (
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-end gap-2 font-semibold text-primary-60"
              aria-expanded={showMoreOptions}
              aria-controls={additionalOptionsId}
              onClick={() =>
                setShowMoreOptions((current) => !current)
              }
            >
              <span>
                {showMoreOptions
                  ? 'Show Less Options'
                  : 'Show More Options'}
              </span>

              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className={mergeCss([
                  'h-5 w-5 shrink-0 transition-transform duration-200',
                  showMoreOptions ? 'rotate-180' : '',
                ])}
              >
                <path
                  d="M4 7.5 10 13l6-5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </ExpandableContainer>
    </div>
  );
}
