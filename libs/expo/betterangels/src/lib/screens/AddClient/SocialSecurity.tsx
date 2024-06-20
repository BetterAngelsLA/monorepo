import { Colors } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CreateClientProfileInput } from '../../apollo';
import { formatSSN } from '../../helpers';

interface ISocialSecurityProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

const initialSSN = {
  ssn1: '',
  ssn2: '',
  ssn3: '',
};

export default function SocialSecurity(props: ISocialSecurityProps) {
  const { expanded, setExpanded, client, setClient, scrollRef } = props;
  const [ssn, setSsn] = useState(
    client.socialSecurity
      ? {
          ssn1: client.socialSecurity.slice(0, 3),
          ssn2: client.socialSecurity.slice(3, 5),
          ssn3: client.socialSecurity.slice(5, 9),
        }
      : initialSSN
  );

  const isSocialSecurity = expanded === 'Social Security';

  const handleSSNChange = (e: string, key: 'ssn1' | 'ssn2' | 'ssn3') => {
    const newSSN: { ssn1: string; ssn2: string; ssn3: string } = { ...ssn };
    newSSN[key] = e;
    setSsn(newSSN);
    setClient({
      ...client,
      socialSecurity: Object.values(newSSN).join(''),
    });
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isSocialSecurity ? null : 'Social Security');
      }}
      mb="xs"
      actionName={
        !client.socialSecurity && !isSocialSecurity ? (
          <TextMedium size="sm">Add SSN</TextMedium>
        ) : (
          <TextMedium size="sm">
            {formatSSN(client.socialSecurity ? client.socialSecurity : '')}
          </TextMedium>
        )
      }
      title="Social Security"
    >
      <View
        style={{
          gap: 2.5,
          height: isSocialSecurity ? 'auto' : 0,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <BasicInput
            maxLength={3}
            keyboardType="number-pad"
            value={ssn.ssn1}
            onChangeText={(e) => handleSSNChange(e, 'ssn1')}
          />
        </View>
        <View
          style={{ width: 5, height: 1, backgroundColor: Colors.NEUTRAL_DARK }}
        />
        <View style={{ flex: 1 }}>
          <BasicInput
            maxLength={2}
            keyboardType="number-pad"
            value={ssn.ssn2}
            onChangeText={(e) => handleSSNChange(e, 'ssn2')}
          />
        </View>
        <View
          style={{ width: 5, height: 1, backgroundColor: Colors.NEUTRAL_DARK }}
        />
        <View style={{ flex: 1 }}>
          <BasicInput
            maxLength={4}
            keyboardType="number-pad"
            value={ssn.ssn3}
            onChangeText={(e) => handleSSNChange(e, 'ssn3')}
          />
        </View>
      </View>
    </FieldCard>
  );
}
