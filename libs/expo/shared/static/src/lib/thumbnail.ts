enum DocType {
  BirthCertificate = 'BirthCertificate',
  SocialSecurityCard = 'SocialSecurityCard',
  PhotoId = 'PhotoId',
  ConsentForm = 'ConsentForm',
  HmisForm = 'HmisForm',
  IncomeForm = 'IncomeForm',
}

type TThumbnailSize = {
  height: number;
  width: number;
};

export const thumbnailSizes: Record<DocType, TThumbnailSize> = {
  [DocType.BirthCertificate]: { height: 395, width: 236 },
  [DocType.SocialSecurityCard]: { height: 86.5, width: 129 },
  [DocType.PhotoId]: { height: 86.5, width: 129 },
  [DocType.ConsentForm]: { height: 395, width: 236 },
  [DocType.HmisForm]: { height: 86.5, width: 129 },
  [DocType.IncomeForm]: { height: 86.5, width: 129 },
};
