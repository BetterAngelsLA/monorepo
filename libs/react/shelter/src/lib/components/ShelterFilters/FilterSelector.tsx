import { CheckboxGroup, ExpandableContainer } from '@monorepo/react/components';
import { TFilterOptionType, TShelterFilterOption } from './config';

type IProps = {
  className?: string;
  header: string;
  name: string;
  options: TShelterFilterOption[];
  values?: TFilterOptionType[] | null;
  expanded?: boolean;
  onChange: (name: string, selected: string[]) => void;
};

export function FilterSelector(props: IProps) {
  const { header, name, options, values, expanded, onChange, className } =
    props;

  return (
    <div className={className}>
      <ExpandableContainer header={header} open={!!expanded}>
        <CheckboxGroup
          options={options}
          values={values || []}
          onChange={(selected) => onChange(name, selected)}
          selectAll="Select All"
        />
      </ExpandableContainer>
    </div>
  );
}
