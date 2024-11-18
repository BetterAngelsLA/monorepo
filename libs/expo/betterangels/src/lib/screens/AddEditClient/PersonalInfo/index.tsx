import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { RefObject, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { useCaliforniaIdUniqueCheck } from '../../../hooks';
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
  const { control, setError, clearErrors } = useFormContext();
  const [californiaId] = useWatch({
    control,
    name: ['californiaId'],
  });

  const validationError = useCaliforniaIdUniqueCheck(
    californiaId,
    clientProfileId as string
  );

  useEffect(() => {
    if (validationError) {
      setError('californiaId', {
        type: 'manual',
        message: validationError,
      });
    } else {
      clearErrors('californiaId');
    }
  }, [validationError, setError, clearErrors]);

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
