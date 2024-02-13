import { MainScrollContainer } from '@monorepo/expo/betterangels';
import {
  BodyText,
  BottomActions,
  CancelModal,
  H2,
  H3,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import DateComponent from './Date';
import HmisId from './HmisId';
import Question1 from './question1';
import Question2 from './question2';
import Question3 from './question3';

export default function Phq9() {
  const { clientId, hmisId } = useLocalSearchParams<{
    clientId: string;
    hmisId?: string | undefined;
  }>();
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const methods = useForm({
    defaultValues: {
      hmisId: hmisId || undefined,
      date: format(new Date(), 'MM/dd/yy'),
    },
  });
  const props = {
    expanded,
    setExpanded,
  };

  function onSubmit(data: any) {
    console.log(data);
  }

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer pt="lg">
          <H2 mb="sm">Patient Health Questionnaire(PHQ-9)</H2>
          <BodyText mb="sm" size="sm">
            Please fill the information below and start answering 10 questions.
            It will give the score at the end. (Takes about 2-3 min){' '}
          </BodyText>
          <HmisId {...props} />
          <DateComponent {...props} />
          <H3 ml="xs" mt="lg" mb="sm">
            Questions
          </H3>
          <Question1 {...props} />
          <Question2 {...props} />
          <Question3 {...props} />
        </MainScrollContainer>
        <BottomActions
          cancel={
            <CancelModal
              body="All data associated with PHQ-9 form will be deleted"
              title="Delete PHQ-9 form?"
            />
          }
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </View>
    </FormProvider>
  );
}
