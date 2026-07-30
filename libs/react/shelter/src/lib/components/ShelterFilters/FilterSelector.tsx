import { CheckboxGroup, ExpandableContainer } from '@monorepo/react/components';
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
  onChange: (name: TFilterConfig['name'], selected: string[]) => void;
};

const PRIORITY_OPTION_COUNT = 7;

export function FilterSelector(props: IProps) {
  const { header, name, options, values, expanded, onChange, className } =
    props;

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const optionsId = useId();

  /**
   * Alphabetize all options before dividing them into the initial
   * and additional option groups.
   *
   * Replace `label` below if TShelterFilterOption uses a different
   * property for its visible text.
   */
  const sortedOptions = useMemo(
    () =>
      [...options].sort((first, second) =>
        first.label.localeCompare(second.label, undefined, {
          sensitivity: 'base',
        }),
      ),
    [options],
  );

  const hasAdditionalOptions = sortedOptions.length > PRIORITY_OPTION_COUNT;

  const visibleOptions = showMoreOptions
    ? sortedOptions
    : sortedOptions.slice(0, PRIORITY_OPTION_COUNT);

  function handleOptionsChange(selected: string[]) {
    const visibleValues = new Set(
      visibleOptions.map((option) => String(option.value)),
    );

    const hiddenSelectedValues = (values ?? [])
      .map(String)
      .filter((value) => !visibleValues.has(value));

    onChange(name, [...hiddenSelectedValues, ...selected]);
  }

  return (
    <div className={className}>
      <ExpandableContainer header={header} open={!!expanded}>
        <div id={optionsId}>
          <CheckboxGroup
            options={visibleOptions}
            values={(values ?? []).map(String)}
            onChange={handleOptionsChange}
            selectAll="Select All"
          />
        </div>

        {hasAdditionalOptions && (
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-end gap-3 font-semibold text-primary-60"
            aria-expanded={showMoreOptions}
            aria-controls={optionsId}
            onClick={() => setShowMoreOptions((current) => !current)}
          >
            <span>
              {showMoreOptions ? 'Show Less Options' : 'Show More Options'}
            </span>

            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={mergeCss([
                'h-5 w-5 transition-transform duration-200',
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
      </ExpandableContainer>
    </div>
  );
}
