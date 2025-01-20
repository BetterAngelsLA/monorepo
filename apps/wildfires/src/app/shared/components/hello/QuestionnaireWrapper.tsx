import { useContext, useEffect, useState } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionnaireNav } from '../questionnaire/QuestionnaireNav';
import { QuestionStepper } from './QuestionStepper';
import { QuestionsBlock } from './QuestionsBlock';
import { QuestionnaireContext } from './provider/questionnaireContext';
import { TAnswer, TQuestionnaire, TSection } from './types';
import { getSectionById } from './utils/getSectionById';

type IProps = {
  config: TQuestionnaire;
  className?: string;
};

export function QuestionnaireWrapper(props: IProps) {
  const { className, config } = props;

  const sections = config.sections;

  const context = useContext(QuestionnaireContext);

  if (!context) {
    throw new Error(
      'QuestionnaireContext must be used with QuestionnaireWrapper'
    );
  }

  const {
    currentQuestion,
    setNextQuestion,
    answers,
    setAnswers,
    clearQuestionHistory,
    popQuestionHistory,
  } = context;

  const [sectionHistory, setSectionHistory] = useState<TSection[]>([
    sections[0],
  ]);

  const [currentSection, setCurrentSection] = useState<TSection>(sections[0]);

  useEffect(() => {
    const latest = sectionHistory[sectionHistory.length - 1];

    setCurrentSection(latest);
  }, [sectionHistory, setCurrentSection]);

  function onClickNext() {
    if (!currentSection) {
      return;
    }

    if (currentSection.stepper) {
      if (!currentQuestion) {
        return;
      }

      setNextQuestion(currentSection.questions);

      return;
    }

    goToNextSection();
  }

  function goToNextSection() {
    const nextId = currentSection.next;

    if (nextId) {
      const nextSection = getSectionById(sections, nextId);

      if (nextSection) {
        setSectionHistory([...sectionHistory, nextSection]);
        clearQuestionHistory();
      }
    }
  }

  function onClickPrev() {
    console.log('################################### PREV');

    if (currentSection.stepper) {
      const questionIdx = currentSection.questions.findIndex(
        (q) => q.id === currentQuestion?.id
      );

      if (questionIdx === 0) {
        clearQuestionHistory();

        return goToPrevSection();
      }

      return popQuestionHistory();
    }

    goToPrevSection();
  }

  function goToPrevSection() {
    const historyCopy = [...sectionHistory];

    if (!historyCopy.length || historyCopy.length < 2) {
      return;
    }

    historyCopy.pop();

    setSectionHistory(historyCopy);
  }

  function handleAnswer(newAnswer: TAnswer) {
    console.log();
    console.log('| -------------  ROOT-ANSWER  ------------- |');
    console.log(newAnswer);
    console.log();

    const existingIdx = answers.findIndex(
      (a) => a.questionId === newAnswer.questionId
    );

    // update existing answer
    if (existingIdx > -1) {
      setAnswers((prev) => {
        const updated = [...prev];
        updated[existingIdx] = newAnswer;

        return updated;
      });
    }

    // add new answer
    if (existingIdx < 0) {
      setAnswers((prev) => {
        return [...prev, newAnswer];
      });
    }
  }

  const multiStepSection = !!currentSection.stepper;

  //   const next = currentQuestion.next;

  const showPrevBtn = sectionHistory.length > 1;
  const showNextBtn = !!currentSection.next;

  const parentCss = ['pt-8', className];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="mb-4">{currentSection.title}</div>

      {!multiStepSection && (
        <QuestionsBlock
          questions={currentSection.questions}
          answers={answers}
          onAnswer={handleAnswer}
        />
      )}

      {multiStepSection && (
        <QuestionStepper
          questions={currentSection.questions}
          answers={answers}
          onAnswer={handleAnswer}
        />
      )}

      <QuestionnaireNav
        className="mt-12"
        onNext={showNextBtn ? onClickNext : undefined}
        onPrev={showPrevBtn ? onClickPrev : undefined}
      />
    </div>
  );
}
