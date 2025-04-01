import { ComponentType } from 'react';
import { ClientProfileCardEnum } from '../../Client/ClientProfile_V2/constants';
import { TClientProfile } from '../../Client/ClientProfile_V2/types';
import { HmisProfiles } from './HmisProfile/HmisProfiles';

type TRelationComponentProps = {
  clientProfile?: TClientProfile;
};

type TRelationConfig = {
  titlePlural: string;
  titleSingular: string;
  ViewComponent: ComponentType<TRelationComponentProps>;
  FormComponent?: ComponentType<TRelationComponentProps>;
};

export const clientRelatedModelConfig: Record<string, TRelationConfig> = {
  [ClientProfileCardEnum.HmisIds]: {
    titlePlural: 'HMIS IDs',
    titleSingular: 'HMIS ID',
    ViewComponent: HmisProfiles,
  },
};
