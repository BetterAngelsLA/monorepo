import { useContext, useEffect, useState } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionnaireNav } from '../questionnaire/QuestionnaireNav';
import { QuestionStepper } from './QuestionStepper';
import { QuestionsBlock } from './QuestionsBlock';
import { QuestionnaireContext } from './provider/questionnaireContext';
import { TAnswer, TQuestionnaire, TSection } from './types';
import { findQuestionById } from './utils/findQuestionById';
import { getNextQuestionId } from './utils/getNextQuestionId';
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

  const { currentQuestion, setCurrentQuestion } = context;

  const [answers, setAnswers] = useState<TAnswer[]>([]);

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

    console.log('################################### NEXT');
    console.log(currentSection);
    console.log('');

    if (currentSection.stepper) {
      if (!currentQuestion) {
        return;
      }

      const answer = answers.find((a) => a.questionId === currentQuestion.id);

      // no answer yet, do nothing
      if (!answer) {
        return;
      }

      const next = currentQuestion.next;

      // done with section
      if (!next) {
        return goToNextSection();
      }

      const answerOptionId = answer.optionId;

      const nextQuestionId = getNextQuestionId({
        next,
        answerOptionId,
      });

      const nextQuestion = findQuestionById(
        currentSection.questions,
        nextQuestionId as string
      );

      if (nextQuestion) {
        return setCurrentQuestion(nextQuestion);
      }

      console.error(
        `[onClickNext] could not find question by Id [${nextQuestionId}].`
      );

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
      }
    }
  }

  function onClickPrev() {
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

    // update existing result
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

  const showPrevBtn = sectionHistory.length > 1;
  const showNextBtn = !!currentSection.next;

  const parentCss = ['pt-8', className];

  const multiStepSection = !!currentSection.stepper;

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
