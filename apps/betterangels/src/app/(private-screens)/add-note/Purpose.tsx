import { SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  FieldCard,
  H5,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { FieldErrors, useFieldArray, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

interface INote {
  purposes: { value: string }[];
}

type TPurposes = {
  value: string;
}[];

type NoteFormErrors = FieldErrors<INote>;

interface IPurposeProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
}

export default function Purpose(props: IPurposeProps) {
  const { expanded, setExpanded } = props;
  const { control, formState, watch, setValue } = useFormContext();
  const { fields, append } = useFieldArray({
    name: 'purposes',
  });

  const purposes: TPurposes = watch('purposes');
  const firstPurposeValue = watch('purposes[0].value');

  const typedErrors = formState.errors as NoteFormErrors;

  console.log(purposes);

  return (
    <FieldCard
      expanded={expanded}
      setExpanded={() => {
        setValue('purposes', [
          purposes[0],
          ...purposes.slice(1).filter((field) => !!field.value),
        ]);
        setExpanded(expanded === 'Purpose' ? undefined : 'Purpose');
      }}
      error={
        typedErrors?.purposes?.length && typedErrors?.purposes?.length > 0
          ? true
          : false
      }
      required
      mb="xs"
      actionName={firstPurposeValue ? '' : 'Add Purpose'}
      title="Purpose"
    >
      <View
        style={{
          paddingBottom: expanded === 'Purpose' ? Spacings.md : 0,
          height: expanded === 'Purpose' ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {fields.map((purpose, index) => (
          <Input
            key={purpose.id}
            mb="xs"
            error={typedErrors?.purposes?.[0] && index === 0}
            rules={{
              required: index === 0,
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
      </View>

      {purposes[0].value && (
        <View
          style={{
            paddingBottom: expanded !== 'Purpose' ? Spacings.md : 0,
            height: expanded !== 'Purpose' ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {purposes.map((purpose, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: Spacings.xs,
              }}
            >
              <SolidCircleIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
              <BodyText ml="xs">{purpose.value}</BodyText>
            </View>
          ))}
        </View>
      )}
    </FieldCard>
  );
}
