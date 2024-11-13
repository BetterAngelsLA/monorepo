import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { RefObject, useEffect, useState } from 'react';
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
  const { id: clientProfileId } = useLocalSearchParams();
  const {
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useFormContext();
  const [checkForDuplicates, setCheckForDuplicates] = useState(false);
  const californiaId = watch('californiaId');
  const californiaIdLength = 8;
  const { data } = useClientProfilesQuery({
    skip: !checkForDuplicates,
    variables: {
      filters: {
        searchCaliforniaId: {
          clientProfileId: (clientProfileId as string) || null,
          californiaId: californiaId,
        },
      },
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });

  useEffect(() => {
    const shouldCheck =
      californiaId &&
      californiaId.length === californiaIdLength &&
      !errors['californiaId'];

    setCheckForDuplicates(shouldCheck);
  }, [californiaId, errors]);

  useEffect(() => {
    if (data && data?.clientProfiles?.length > 0) {
      setError('californiaId', {
        type: 'manual',
        message: 'This is the same CA ID as another client.',
      });
    } else {
      clearErrors('californiaId');
    }
  }, [data, setError, clearErrors]);

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
