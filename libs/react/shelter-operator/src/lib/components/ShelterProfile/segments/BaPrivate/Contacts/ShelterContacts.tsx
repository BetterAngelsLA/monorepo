import { mergeCss } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import type { Control, FieldArrayWithId } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Button } from '../../../../base-ui/buttons';
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
  disabled?: boolean;
  className?: string;
  contactFormClassName?: string;
};

export function ShelterContacts(props: TProps) {
  const {
    fields,
    control,
    onAdd,
    onRemove,
    isViewMode,
    disabled,
    className,
    contactFormClassName,
  } = props;

  return (
    <div className={mergeCss(['flex flex-col gap-8', className])}>
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
                className={contactFormClassName}
              />
            )}
          />
        ))}
      </div>

      {!isViewMode && (
        <Button
          disabled={disabled}
          variant="primary-sm"
          color="blue"
          className="disabled:bg-[#D3D9E3] disabled:border-[#D3D9E3]"
          onClick={onAdd}
          leftIcon={<Plus size={15} />}
          aria-label="Open form to add a new contact"
        >
          Add contact
        </Button>
      )}
    </div>
  );
}
