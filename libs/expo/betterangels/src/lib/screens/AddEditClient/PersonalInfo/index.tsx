import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import HmisProfiles from './HmisProfiles';
import LivingSituation from './LivingSituation';
import PreferredLanguage from './PreferredLanguage';
import VeteranStatus from './VeteranStatus';

interface IPersonalInfoProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
  clientId?: string;
}

export default function PersonalInfo(props: IPersonalInfoProps) {
  const { scrollRef, expanded, setExpanded, clientId } = props;

  const isPersonalInfo = expanded === 'Personal Info';

  return (
    <Accordion
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isPersonalInfo ? null : 'Personal Info');
      }}
      mb="xs"
      title="Personal Info"
    >
      {isPersonalInfo && (
        <View
          style={{
            height: isPersonalInfo ? 'auto' : 0,
            overflow: 'hidden',
            gap: Spacings.xs,
          }}
        >
          {/* {clientId && <ProfilePhoto clientId={clientId} />} */}
          {/* <FullName /> */}
          {/* <Dob /> */}
          {/* <CaliforniaId /> */}
          <HmisProfiles />
          <PreferredLanguage />
          <VeteranStatus />
          <LivingSituation />
        </View>
      )}
    </Accordion>
  );
}
