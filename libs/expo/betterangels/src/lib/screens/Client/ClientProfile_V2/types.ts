import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientProfileCardTitles } from './constants';

export type TClientProfileCardTitleKey = keyof typeof ClientProfileCardTitles;
export type TClientProfileCardTitle =
  (typeof ClientProfileCardTitles)[TClientProfileCardTitleKey];

export type TClientProfile = ClientProfileQuery['clientProfile'];
