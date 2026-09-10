import { mergeCss } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import type { Control, FieldArrayWithId } from 'react-hook-form';
import { Controller, useFormState } from 'react-hook-form';
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

  // Errors for a contact live at nested paths like
  // `additionalContacts.0.contactEmail`, not on the object path
  // (`additionalContacts.0`) this list is registered under. Read the whole
  // `additionalContacts` error subtree so each contact row receives its child
  // field messages instead of a bare object-level error.
  const { errors } = useFormState({ control, name: 'additionalContacts' });

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
        {fields.map((field, index) => {
          const contactErrors = (errors.additionalContacts?.[index] ??
            undefined) as ContactFormErrors | undefined;

          return (
            <Controller
              key={field._rhfId}
              name={`additionalContacts.${index}`}
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <ShelterContactForm
                  entry={value}
                  onChange={(patch) => onChange({ ...value, ...patch })}
                  onBlur={onBlur}
                  onRemove={() => onRemove(index)}
                  errors={contactErrors}
                  isViewMode={isViewMode}
                  className={contactFormClassName}
                />
              )}
            />
          );
        })}
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
