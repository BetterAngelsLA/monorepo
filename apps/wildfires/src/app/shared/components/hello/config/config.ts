import { TQuestionnaire, TSection } from '../types';
import { sectionA } from './a.config';
import { sectionB } from './b.config';
import { sectionC } from './c.config';
import { sectionD } from './d.config';

const sections: TSection[] = [
  { ...sectionA, next: 'sectionB' },
  { ...sectionB, next: 'sectionC' },
  { ...sectionC, next: 'sectionD' },
  { ...sectionD },
];

export const config: TQuestionnaire = {
  sections: sections,
};
