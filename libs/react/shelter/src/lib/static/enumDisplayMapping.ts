import { DemographicChoices } from '../apollo';

export const enumDisplayDemographics: { [key in DemographicChoices]: string } =
  {
    [DemographicChoices.All]: 'All',
    [DemographicChoices.Families]: 'Families',
    [DemographicChoices.Other]: 'Other',
    [DemographicChoices.Seniors]: 'Seniors',
    [DemographicChoices.SingleMen]: 'Single Man',
    [DemographicChoices.SingleMoms]: 'Single Moms',
    [DemographicChoices.SingleWomen]: 'Single Woman',
    [DemographicChoices.TayTeen]: 'Tay Teen',
  };
