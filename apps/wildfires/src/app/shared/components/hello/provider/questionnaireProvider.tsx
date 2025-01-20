import { ReactElement, ReactNode, useState } from 'react';
import { TQuestion } from '../types';
import { QuestionnaireContext } from './questionnaireContext';

type TQuestionnaireProvider = {
  children: ReactNode;
};

export default function QuestionnaireProvider(
  props: TQuestionnaireProvider
): ReactElement {
  const { children } = props;

  const [currentQuestion, setCurrentQuestion] = useState<TQuestion | null>(
    null
  );

  return (
    <QuestionnaireContext.Provider
      value={{ currentQuestion, setCurrentQuestion }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}
