import { Button } from '../../../../base-ui/buttons';
import { Input } from '../../../../base-ui/input';
import { Switch } from '../../../../base-ui/switch';
import { Text } from '../../../../base-ui/text/text';
import { Form } from '../../../../form/Form';
import type { ContactFormData } from './formSchema';

export type ContactFormErrors = {
  contactName?: { message?: string };
  contactNumber?: { message?: string };
  contactEmail?: { message?: string };
};

type TProps = {
  entry: ContactFormData;
  onChange: (patch: Partial<ContactFormData>) => void;
  onRemove: () => void;
  errors?: ContactFormErrors;
  isViewMode?: boolean;
};

export function ShelterContactForm(props: TProps) {
  const { entry, onChange, onRemove, errors, isViewMode } = props;

  return (
    <div className="rounded-lg border-2 border-gray-200 p-4">
      <div className="min-h-[48px] mb-4 flex items-center justify-between w-full">
        <Text variant="body-bold">Contact</Text>

        {!isViewMode && (
          <Button
            variant="trash"
            onClick={onRemove}
            aria-label="Remove contact"
          />
        )}
      </div>

      <Form.Block columns={2}>
        <Input
          label="Name"
          dataType="string"
          value={entry.contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          required
          isViewMode={isViewMode}
          error={errors?.contactName?.message}
        />

        <Input
          label="Phone"
          dataType="phone-number"
          value={entry.contactNumber}
          onChange={(e) => onChange({ contactNumber: e.target.value })}
          required
          isViewMode={isViewMode}
          error={errors?.contactNumber?.message}
        />

        <Input
          label="Email"
          dataType="email"
          value={entry.contactEmail}
          onChange={(e) => onChange({ contactEmail: e.target.value })}
          isViewMode={isViewMode}
          error={errors?.contactEmail?.message}
        />

        <Input
          label="Title"
          dataType="string"
          value={entry.contactTitle}
          onChange={(e) => onChange({ contactTitle: e.target.value })}
          isViewMode={isViewMode}
        />
      </Form.Block>

      <div className="mt-4">
        <Switch
          label="Claimant"
          value={entry.isClaimant}
          onChange={(value) => onChange({ isClaimant: value })}
          isViewMode={isViewMode}
          trueLabel="Yes"
          falseLabel="No"
        />
      </div>
    </div>
  );
}
