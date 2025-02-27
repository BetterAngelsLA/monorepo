import { ClientSectionTitles } from './constants';

export type TClientSectionTitleKey = keyof typeof ClientSectionTitles;
export type TClientSectionTitle =
  (typeof ClientSectionTitles)[TClientSectionTitleKey];
