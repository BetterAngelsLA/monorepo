import { useShelter } from '../../../hooks/useShelter';
import { DEMOGRAPHICS_OPTIONS } from '../../../pages/dashboard/formOptions';
import { Dropdown } from '../../base-ui/dropdown';
import { Input } from '../../base-ui/input';

function getSelectedOptions<T extends string>(
  values: ReadonlyArray<{ name?: T | null }>,
  options: ReadonlyArray<{ value: T; label: string }>
) {
  const selected = new Set(
    values.map((v) => v.name).filter((n): n is T => n != null)
  );

  return options.filter((option) => selected.has(option.value));
}

type TProps = {
  shelterId: string;
};

export function BasicInfo(props: TProps) {
  const { shelterId } = props;

  const { shelter } = useShelter(shelterId);

  const { name, demographics = [] } = shelter || {};

  console.log(shelter);
  console.log(demographics);

  return (
    <div className="px-6">
      <div className="mt-12 p-4 w-96 border border-gray-100">
        <Input
          label="Name"
          dataType="string"
          value={name}
          onChange={(v) => console.log(v.target.value)}
          disabled={true}
          required={true}
        />
      </div>

      <div className="mt-12 p-4 w-96 border border-gray-100">
        <Dropdown
          label="Demographics Served"
          options={DEMOGRAPHICS_OPTIONS}
          isMulti={true}
          onChange={(v) => {
            console.log(v);
          }}
          value={getSelectedOptions(demographics, DEMOGRAPHICS_OPTIONS)}
        />
      </div>
    </div>
  );
}
