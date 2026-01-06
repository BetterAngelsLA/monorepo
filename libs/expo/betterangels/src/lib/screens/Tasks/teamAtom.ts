import { atom } from 'jotai';
import { SelahTeamEnum } from '../../apollo';

export const teamAtom = atom<SelahTeamEnum | null>(
  // SelahTeamEnum.HollywoodOnSite
  SelahTeamEnum.EchoParkOnSite
);
