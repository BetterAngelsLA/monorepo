import { TSection } from '../types';

export function getSectionById(sections: TSection[], id: string) {
  return sections.find((s) => s.id === id);
}
