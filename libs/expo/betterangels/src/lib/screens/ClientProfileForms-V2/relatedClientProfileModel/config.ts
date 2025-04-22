import { ComponentType } from 'react';
import { ViewStyle } from 'react-native';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { TClientProfile } from '../../Client/ClientProfile_V2/types';
import { HmisProfileForm } from './forms/HmisProfileForm/HmisProfileForm';
import { HmisProfilesView } from './views/HmisProfilesView';

type TRelationComponentProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
  style?: ViewStyle;
};

type TRelationConfig = {
  titlePlural: string;
  titleSingular: string;
  ViewComponent: ComponentType<TRelationComponentProps>;
  FormComponent: ComponentType<TRelationComponentProps>;
};

export const clientRelatedModelConfig: Record<string, TRelationConfig> = {
  [ClientProfileSectionEnum.HmisIds]: {
    titlePlural: 'HMIS IDs',
    titleSingular: 'HMIS ID',
    ViewComponent: HmisProfilesView,
    FormComponent: HmisProfileForm,
  },
};
