import { MainScrollContainer } from '@monorepo/expo/betterangels';
import {
  BodyText,
  BottomActions,
  CancelModal,
  H2,
  H3,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import DateComponent from './Date';
import HmisId from './HmisId';
import Question from './question';

type TQuestions = {
  [key in 'depressed' | 'anxious' | 'suicidal']: {
    questions: {
      title: string;
      field: string;
    }[];
    type: 'PHQ-9' | 'GAD-7';
  };
};
// TODO: fields names should be changed to actual field names
const QUESTIONS: TQuestions = {
  depressed: {
    type: 'PHQ-9',
    questions: [
      {
        title: 'Little interest or pleasure in doing things.',
        field: 'question1',
      },
      {
        title: 'Feeling down, depressed, or hopeless.',
        field: 'question2',
      },
      {
        title: 'Trouble falling or staying asleep, or sleeping too much.',
        field: 'question3',
      },
      {
        title: 'Feeling tired or having little energy.',
        field: 'question4',
      },
      {
        title: 'Poor appetite or overeating.',
        field: 'question5',
      },
      {
        title:
          'Feeling bad about yourself - or that you are a failure or have let yourself or your family down.',
        field: 'question6',
      },
      {
        title:
          'Trouble concentrating on things, such as reading the newspaper or watching television.',
        field: 'question7',
      },
      {
        title:
          'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual.',
        field: 'question8',
      },
      {
        title:
          'Thoughts that you would be better off dead, or of hurting yourself in some way.',
        field: 'question9',
      },
    ],
  },
  anxious: {
    type: 'GAD-7',
    questions: [
      {
        title: 'Feeling nervous, anxious, or on edge.',
        field: 'question1',
      },
      {
        title: 'Not being able to stop or control worrying.',
        field: 'question2',
      },
      {
        title: 'Worrying too much about different things.',
        field: 'question3',
      },
      {
        title: 'Trouble relaxing.',
        field: 'question4',
      },
      {
        title: 'Being so restless that it is hard to sit still.',
        field: 'question5',
      },
      {
        title: 'Becoming easily annoyed or irritable.',
        field: 'question6',
      },
      {
        title: 'Feeling afraid as if something awful might happen.',
        field: 'question7',
      },
    ],
  },
  suicidal: {
    type: 'GAD-7',
    questions: [
      {
        title:
          'Have you wished you were dead or wished you could go to sleep and not wake up?.',
        field: 'question',
      },
      {
        title:
          'Have you wished you were dead or wished you could go to sleep and not wake up?.',
        field: 'question1',
      },
      {
        title: 'Have you actually had any thoughts of killing yourself?.',
        field: 'question2',
      },
      {
        title: 'Have you been thinking about how you might do this?.',
        field: 'question3',
      },
      {
        title:
          'Have you had these thoughts and had some intention of acting on them?.',
        field: 'question4',
      },
      {
        title:
          'Have you started to work out the details of how to kill yourself? \n- Plan? \n- Means? \n- Timeframe? \nDo you intend to carry out this plan?',
        field: 'question5',
      },
    ],
  },
};

export default function FormScreen() {
  const navigation = useNavigation();
  const { clientId, hmisId, mood } = useLocalSearchParams<{
    clientId: string;
    hmisId?: string | undefined;
    mood: 'depressed' | 'anxious' | 'suicidal';
  }>();

  if (!clientId || !mood) {
    throw new Error('clientId and mood are required');
  }

  const formType = QUESTIONS[mood].type;

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

  useEffect(() => {
    navigation.setOptions({
      title: formType,
    });
  }, [formType, navigation]);

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer pt="lg">
          <H2 mb="sm">Patient Health Questionnaire({formType})</H2>
          <BodyText mb="sm" size="sm">
            Please fill the information below and start answering 10 questions.
            It will give the score at the end. (Takes about 2-3 min){' '}
          </BodyText>
          <HmisId {...props} />
          <DateComponent {...props} />
          <H3 ml="xs" mt="lg" mb="sm">
            Questions
          </H3>
          {QUESTIONS[mood].questions.map(
            (question: { field: string; title: string }, index: number) => (
              <Question
                {...props}
                key={question.field}
                title={`${index + 1}. ${question.title}`}
                field={question.field}
              />
            )
          )}
        </MainScrollContainer>
        <BottomActions
          cancel={
            <CancelModal
              body={`All data associated with ${formType} form will be deleted`}
              title={`Delete ${formType} form?`}
            />
          }
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </View>
    </FormProvider>
  );
}
