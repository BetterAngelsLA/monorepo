import { useMutation } from '@apollo/client';
import {
  UPDATE_NOTE,
  UpdateNoteMutation,
  UpdateNoteMutationVariables,
} from '@monorepo/expo/betterangels';
import {
  BasicInput,
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { RefObject, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

interface IPurposeProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  scrollRef: RefObject<ScrollView>;
  purpose: string | null | undefined;
  noteId: string | undefined;
  errors: {
    purpose: boolean;
    location: boolean;
    date: boolean;
    time: boolean;
  };
  setErrors: (errors: {
    purpose: boolean;
    location: boolean;
    date: boolean;
    time: boolean;
  }) => void;
}

export default function Purpose(props: IPurposeProps) {
  const {
    expanded,
    setExpanded,
    scrollRef,
    purpose,
    noteId,
    setErrors,
    errors,
  } = props;

  const [updateNote] = useMutation<
    UpdateNoteMutation,
    UpdateNoteMutationVariables
  >(UPDATE_NOTE);

  const [value, setValue] = useState<string | null | undefined>(purpose);

  const isPurpose = expanded === 'Purpose';

  const updateNoteFunction = useRef(
    debounce(async (value: string) => {
      if (!noteId || !value) return;

      try {
        await updateNote({
          variables: {
            data: {
              id: noteId,
              purpose: value,
            },
          },
        });
      } catch (err) {
        console.error(err);
      }
    }, 500)
  ).current;

  const onChange = (value: string) => {
    if (!value) {
      setErrors({ ...errors, purpose: true });
    }
    if (value) {
      setErrors({ ...errors, purpose: false });
    }
    setValue(value);
    updateNoteFunction(value);
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      required
      mb="xs"
      setExpanded={() => setExpanded(isPurpose ? null : 'Purpose')}
      title="Purpose"
      actionName={
        !value && !isPurpose ? (
          <TextMedium size="sm">Add Purpose</TextMedium>
        ) : null
      }
    >
      <View
        style={{
          height: isPurpose ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <BasicInput
          placeholder="Enter purpose"
          maxLength={100}
          onDelete={() => {
            setValue('');
            setErrors({ ...errors, purpose: true });
          }}
          error={!!errors.purpose}
          errorMessage={errors.purpose ? 'Purpose is required' : ''}
          value={value || undefined}
          onChangeText={(e) => onChange(e)}
        />
      </View>
      {value && !isPurpose && <TextRegular mb="md">{value}</TextRegular>}
    </FieldCard>
  );
}
