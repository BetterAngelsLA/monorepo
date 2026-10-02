import { InstagramLink } from '@monorepo/react/components';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { Input } from '../../../../base-ui/input';
import { Label } from '../../../../base-ui/label';
import { type BasicInfoFormData } from '../formSchema';

type TProps = {
  control: Control<BasicInfoFormData>;
  error?: string;
  isViewMode?: boolean;
  disabled?: boolean;
};

/**
 * Instagram is the only field that resolves its value into a link in view mode,
 * so it renders a link there instead of a read-only input.
 *
 * Format validation lives in `formSchema` so it gates submit for the create and
 * edit flows alike. It is format-only — it cannot tell whether the handle exists
 * (Instagram returns 200 for missing profiles), so there is no "verified"
 * affordance here.
 */
export function InstagramField(props: TProps) {
  const { control, error, isViewMode, disabled } = props;

  // Read the value from the form so view and edit mode can't disagree.
  const value = useWatch({ control, name: 'instagram' });

  if (isViewMode) {
    return (
      <div className="relative flex w-full flex-col gap-1 font-sans">
        <Label label="Instagram handle" variant="offset" />

        <div className="flex h-12 w-full items-center rounded-full border border-transparent bg-white px-5">
          <InstagramLink
            handleOrHref={value}
            label={value}
            icon={true}
            openExternal={true}
            className="text-sm text-gray-900" // TODO: abstract styles from base-ui/input
          />
        </div>
      </div>
    );
  }

  return (
    <Controller
      name="instagram"
      control={control}
      render={({ field }) => (
        <Input
          label="Instagram handle"
          dataType="string"
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={disabled}
          error={error}
        />
      )}
    />
  );
}
