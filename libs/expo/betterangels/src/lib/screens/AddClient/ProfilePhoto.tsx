import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, TextMedium } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { CreateClientProfileInput } from '../../apollo';

interface IProfilePhotoProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function ProfilePhoto(props: IProfilePhotoProps) {
  const { expanded, setExpanded, client, scrollRef } = props;
  const isProfilePhoto = expanded === 'Profile Photo';
  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isProfilePhoto ? null : 'Date of Birth');
      }}
      required
      mb="xs"
      actionName={
        !client.dateOfBirth && !isProfilePhoto ? (
          <TextMedium size="sm">Add Photo</TextMedium>
        ) : (
          ''
        )
      }
      title="Profile Photo"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isProfilePhoto ? 'auto' : 0,
          overflow: 'hidden',
        }}
      ></View>
    </FieldCard>
  );
}
