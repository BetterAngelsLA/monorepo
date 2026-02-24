import { ComponentType } from 'react';
import { ViewStyle } from 'react-native';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { TClientProfile } from '../../Client/ClientProfile/types';
import { ClientContactForm } from './forms/ClientContactsForm';
import { HouseholdMemberForm } from './forms/HouseholdMemberForm';
import { ProfileFormHmis } from './forms/ProfileFormHmis/ProfileFormHmis';
import { ClientContactsView } from './views/ClientContactsView';
import { HouseholdMemebersView } from './views/HouseholdMemebersView';
import { ProfilesViewHmis } from './views/ProfilesViewHmis';

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
    ViewComponent: ProfilesViewHmis,
    FormComponent: ProfileFormHmis,
  },
  [ClientProfileSectionEnum.Household]: {
    titlePlural: 'Household',
    titleSingular: 'Household',
    ViewComponent: HouseholdMemebersView,
    FormComponent: HouseholdMemberForm,
  },
  [ClientProfileSectionEnum.RelevantContacts]: {
    titlePlural: 'Relevant Contacts',
    titleSingular: 'Relevant Contact',
    ViewComponent: ClientContactsView,
    FormComponent: ClientContactForm,
  },
};
