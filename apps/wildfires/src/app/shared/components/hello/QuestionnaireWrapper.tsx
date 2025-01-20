import { useEffect, useState } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionnaireNav } from '../questionnaire/QuestionnaireNav';
import { QuestionsBlock } from './QuestionsBlock';
import { TQuestionnaire, TSection } from './types';
import { getSectionById } from './utils/getSectionById';

type IProps = {
  config: TQuestionnaire;
  className?: string;
};

export function QuestionnaireWrapper(props: IProps) {
  const { className, config } = props;

  const sections = config.sections;

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

  const showPrevBtn = sectionHistory.length > 1;
  const showNextBtn = !!currentSection.next;

  const parentCss = ['pt-8', className];

  return (
    <div className={mergeCss(parentCss)}>
      <QuestionsBlock section={currentSection} />

      <QuestionnaireNav
        className="mt-12"
        onNext={showNextBtn ? onClickNext : undefined}
        onPrev={showPrevBtn ? onClickPrev : undefined}
      />
    </div>
  );
}
