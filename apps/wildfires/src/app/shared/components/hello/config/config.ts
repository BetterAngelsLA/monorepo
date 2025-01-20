import { TQuestionnaire, TSection } from '../types';
import { sectionA } from './a.config';
import { sectionB } from './b.config';
import { sectionD } from './d.config';
import { stepperSection } from './stepper.config';

const sections: TSection[] = [
  // { ...stepperSection, next: 'sectionA' },
  // { ...sectionA, next: 'sectionB' },
  // { ...sectionB, next: 'sectionD' },
  // { ...sectionD },

  { ...sectionA, next: 'stepperSection' },
  { ...stepperSection, next: 'sectionB' },
  { ...sectionB, next: 'sectionD' },
  { ...sectionD },

  // { ...sectionA, next: 'sectionB' },
  // { ...sectionB, next: 'stepperSection' },
  // { ...stepperSection, next: 'sectionD' },
  // { ...sectionD },
];

export const config: TQuestionnaire = {
  sections: sections,
};
