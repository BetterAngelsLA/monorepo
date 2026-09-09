import { Plus } from 'lucide-react';
import type { Control, FieldArrayWithId } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text } from '../../../../base-ui/text/text';
import type { AdditionalContactsFormData } from '../formSchema';
import {
  ShelterContactForm,
  type ContactFormErrors,
} from './ShelterContactForm';

type TProps = {
  fields: FieldArrayWithId<
    AdditionalContactsFormData,
    'additionalContacts',
    '_rhfId'
  >[];
  control: Control<AdditionalContactsFormData>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isViewMode?: boolean;
};

export function ShelterContacts(props: TProps) {
  const { fields, control, onAdd, onRemove, isViewMode } = props;

  return (
    <>
      <Text variant="subheading" className="pl-5">
        Additional Contacts
      </Text>

      {fields.length === 0 && (
        <Text variant="body-light" className="pl-5">
          No additional contacts.
        </Text>
      )}

      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <Controller
            key={field._rhfId}
            name={`additionalContacts.${index}`}
            control={control}
            render={({ field: { value, onChange }, fieldState }) => (
              <ShelterContactForm
                entry={value}
                onChange={(patch) => onChange({ ...value, ...patch })}
                onRemove={() => onRemove(index)}
                errors={fieldState.error as ContactFormErrors | undefined}
                isViewMode={isViewMode}
              />
            )}
          />
        ))}
      </div>

      {!isViewMode && (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-[#008CEE]"
        >
          <Plus size={15} />
          Add contact
        </button>
      )}
    </>
  );
}
