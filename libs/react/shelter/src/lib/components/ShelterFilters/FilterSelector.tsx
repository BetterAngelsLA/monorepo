import { CheckboxGroup, ExpandableContainer } from '@monorepo/react/components';
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
  onChange: (name: TFilterConfig['name'], selected: string[]) => void;
};

const PRIORITY_OPTION_COUNT = 7;

export function FilterSelector(props: IProps) {
  const { header, name, options, values, expanded, onChange, className } =
    props;

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const optionsId = useId();

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
            className="mt-8 flex w-full items-center justify-end gap-2 text-primary-20"
            aria-expanded={showMoreOptions}
            aria-controls={optionsId}
            onClick={() => setShowMoreOptions((current) => !current)}
          >
            <span>
              {showMoreOptions ? 'Show Less Options' : 'Show More Options'}
            </span>

            <ChevronLeftIcon
              className={mergeCss([
                'w-3',
                showMoreOptions ? 'rotate-90' : '-rotate-90',
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
