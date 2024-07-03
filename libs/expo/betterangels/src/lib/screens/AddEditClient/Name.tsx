import { Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  Input,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../apollo';

interface INameProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function Name(props: INameProps) {
  const { expanded, setExpanded, scrollRef } = props;

  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const firstName = watch('user.firstName');
  const lastName = watch('user.lastName');

  const isName = expanded === 'Name';

  return (
    <FieldCard
      error={errors.user?.firstName ? 'First Name is required' : ''}
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isName ? null : 'Name');
      }}
      required
      mb="xs"
      actionName={
        !firstName && !isName ? (
          <TextMedium size="sm">Add Name</TextMedium>
        ) : (
          <TextMedium size="sm">
            {firstName} {lastName}
          </TextMedium>
        )
      }
      title="Name"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isName ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <Input
          placeholder="Enter First Name"
          required
          error={!!errors.user?.firstName}
          rules={{
            required: true,
          }}
          label="First Name"
          name="user.firstName"
          control={control}
        />
        <Input
          placeholder="Enter Middle Name"
          label="Middle Name"
          name="user.middleName"
          control={control}
        />
        <Input
          placeholder="Enter Last Name"
          label="Last Name"
          name="user.lastName"
          control={control}
        />
        <Input
          placeholder="Enter Nickname"
          label="Nickname"
          name="user.nickname"
          control={control}
        />
      </View>
    </FieldCard>
  );
}
