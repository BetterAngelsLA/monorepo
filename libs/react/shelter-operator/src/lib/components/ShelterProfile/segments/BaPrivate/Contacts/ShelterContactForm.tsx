import { mergeCss } from '@monorepo/react/shared';
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
  contactTitle?: { message?: string };
};

type TProps = {
  entry: ContactFormData;
  onChange: (patch: Partial<ContactFormData>) => void;
  onRemove: () => void;
  onBlur: () => void;
  errors?: ContactFormErrors;
  isViewMode?: boolean;
  className?: string;
};

export function ShelterContactForm(props: TProps) {
  const { entry, onChange, onRemove, onBlur, errors, isViewMode, className } =
    props;

  return (
    <div
      className={mergeCss(['rounded-xl border border-gray-200 p-4', className])}
    >
      <div className="min-h-[48px] mb-4 flex items-center justify-between w-full">
        <Text variant="body-bold" className="pl-5">
          Contact
        </Text>

        {!isViewMode && (
          <Button
            variant="trash"
            onClick={onRemove}
            aria-label={`Remove contact: ${entry.contactName || 'name field empty'}`}
          />
        )}
      </div>

      <Form.Block columns={2}>
        <Input
          label="Name"
          dataType="string"
          value={entry.contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          onBlur={onBlur}
          required
          isViewMode={isViewMode}
          error={errors?.contactName?.message}
        />

        <Input
          label="Phone"
          dataType="phone-number"
          value={entry.contactNumber}
          onChange={(e) => onChange({ contactNumber: e.target.value })}
          onBlur={onBlur}
          required
          isViewMode={isViewMode}
          error={errors?.contactNumber?.message}
        />

        <Input
          label="Email"
          dataType="email"
          value={entry.contactEmail}
          onChange={(e) => onChange({ contactEmail: e.target.value })}
          onBlur={onBlur}
          isViewMode={isViewMode}
          error={errors?.contactEmail?.message}
        />

        <Input
          label="Title"
          maxLength={255}
          dataType="string"
          value={entry.contactTitle}
          onChange={(e) => onChange({ contactTitle: e.target.value })}
          onBlur={onBlur}
          isViewMode={isViewMode}
          error={errors?.contactTitle?.message}
        />
      </Form.Block>

      <div className="mt-8">
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
