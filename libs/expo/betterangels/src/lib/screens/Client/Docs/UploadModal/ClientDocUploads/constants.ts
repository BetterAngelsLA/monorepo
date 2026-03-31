import { Docs } from '../types';

export const DOCUMENT_CONFIG: Record<keyof Docs, { multiple: boolean }> = {
  DriversLicenseFront: { multiple: false },
  DriversLicenseBack: { multiple: false },
  BirthCertificate: { multiple: false },
  PhotoId: { multiple: false },
  SocialSecurityCard: { multiple: false },

  ConsentForm: { multiple: true },
  HmisForm: { multiple: true },
  IncomeForm: { multiple: true },
  OtherClientDocument: { multiple: true },
};
