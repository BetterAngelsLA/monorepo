import { Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  Input,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../apollo';

interface IContactInfoProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function ContactInfo(props: IContactInfoProps) {
  const { expanded, setExpanded, scrollRef } = props;
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const email = watch('user.email');
  const phoneNumber = watch('phoneNumber');
  const address = watch('address');

  const isContactInfo = expanded === 'Contact Info';

  return (
    <FieldCard
      error={errors['user']?.email && 'Enter a valid email address.'}
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isContactInfo ? null : 'Contact Info');
      }}
      mb="xs"
      actionName={
        !(address || phoneNumber || email) && !isContactInfo ? (
          <TextMedium size="sm">Add Contact Info</TextMedium>
        ) : (
          ''
        )
      }
      title="Contact Info"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isContactInfo ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <Input
          placeholder="Enter Mailing Address"
          label="Mailing Address"
          name="address"
          control={control}
        />
        <Input
          placeholder="Enter Phone Number"
          label="Phone Number"
          name="phoneNumber"
          control={control}
          keyboardType="phone-pad"
        />
        <Input
          placeholder="Enter Email"
          label="Email"
          error={!!errors['user']?.email}
          name="user.email"
          control={control}
          keyboardType="email-address"
          rules={{
            validate: (value) => value === '' || Regex.email.test(value),
            required: false,
          }}
        />
      </View>

      {address && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular mb="xxs" size="sm">
            Address
          </TextRegular>
          <TextBold size="sm">{address}</TextBold>
        </View>
      )}
      {phoneNumber && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular size="sm">Phone Number</TextRegular>
          <TextBold size="sm">{phoneNumber}</TextBold>
        </View>
      )}
      {email && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular size="sm">Email</TextRegular>
          <TextBold size="sm">{email}</TextBold>
        </View>
      )}
    </FieldCard>
  );
}
