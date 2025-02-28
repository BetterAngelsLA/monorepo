import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientSectionTitles } from './constants';

export type TClientSectionTitleKey = keyof typeof ClientSectionTitles;
export type TClientSectionTitle =
  (typeof ClientSectionTitles)[TClientSectionTitleKey];

export type TClientProfile = ClientProfileQuery['clientProfile'];
