import { Colors, Regex } from '@monorepo/expo/shared/static';
import { FieldCard, H5, Input } from '@monorepo/expo/shared/ui-components';
import { FieldErrors, useFieldArray, useFormContext } from 'react-hook-form';

interface INote {
  purposes: string[];
}

type NoteFormErrors = FieldErrors<INote>;

export default function Purpose() {
  const { control, formState } = useFormContext();
  const { fields, append } = useFieldArray({
    name: 'purposes',
  });

  const typedErrors = formState.errors as NoteFormErrors;

  return (
    <FieldCard
      error={
        typedErrors?.purposes?.length && typedErrors?.purposes?.length > 0
          ? true
          : false
      }
      required
      mb="xs"
      actionName="Add Purpose"
      title="Purpose"
    >
      {fields.map((purpose, index) => (
        <Input
          key={purpose + index.toString()}
          mb="xs"
          error={typedErrors?.purposes?.[index] ? true : false}
          required
          rules={{
            required: true,
            pattern: Regex.empty,
          }}
          control={control}
          name={`purposes[${index}].value`}
        />
      ))}
      <H5
        textAlign="right"
        color={Colors.PRIMARY}
        onPress={() => append('')}
        size="xs"
      >
        Add another Purpose
      </H5>
    </FieldCard>
  );
}
