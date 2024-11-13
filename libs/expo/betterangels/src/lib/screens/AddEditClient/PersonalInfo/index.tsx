import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { RefObject, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { useClientProfilesQuery } from '../../Clients/__generated__/Clients.generated';
import CaliforniaId from './CaliforniaId';
import Dob from './Dob';
import FullName from './FullName';
import HmisProfiles from './HmisProfiles';
import LivingSituation from './LivingSituation';
import PreferredLanguage from './PreferredLanguage';
import VeteranStatus from './VeteranStatus';

interface IPersonalInfoProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function PersonalInfo(props: IPersonalInfoProps) {
  const { scrollRef, expanded, setExpanded } = props;
  const {
    // register,
    formState: { errors },
    watch,
  } = useFormContext();

  // useEffect(() => {
  //   register('californiaId');
  // }, [register]);

  const californiaId = watch('californiaId');

  // const { data, loading } = useClientProfilesQuery({
  //   variables: {
  //     filters: {
  //       search: californiaId,
  //     },
  //   },
  //   fetchPolicy: 'cache-and-network',
  //   nextFetchPolicy: 'cache-first',
  // });

  const { data, loading } = useClientProfilesQuery({
    variables: {
      filters: {
        search: californiaId,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (!errors['californiaId']) {
      // if (!loading) {
      //   console.log(data);
      // }
      console.log('californiaId', californiaId);
    }
  }, [californiaId, errors]);

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
          <FullName />
          <Dob />
          <CaliforniaId />
          <HmisProfiles />
          <PreferredLanguage />
          <VeteranStatus />
          <LivingSituation />
        </View>
      )}
    </Accordion>
  );
}
