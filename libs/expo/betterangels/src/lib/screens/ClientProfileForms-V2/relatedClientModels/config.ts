import { ComponentType } from 'react';
import { ViewStyle } from 'react-native';
import { ClientProfileCardEnum } from '../../Client/ClientProfile_V2/constants';
import { TClientProfile } from '../../Client/ClientProfile_V2/types';
import { HmisProfilesView } from './HmisProfile/HmisProfilesView';

type TRelationComponentProps = {
  clientProfile?: TClientProfile;
  style?: ViewStyle;
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
    ViewComponent: HmisProfilesView,
  },
};
