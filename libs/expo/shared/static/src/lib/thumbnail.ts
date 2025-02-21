enum DocType {
  BirthCertificate = 'BirthCertificate',
  SocialSecurityCard = 'SocialSecurityCard',
  PhotoId = 'PhotoId',
}

export type TThumbnailSize = {
  height: number;
  width: number;
};

export const ImageThumbnailSizeDefault: TThumbnailSize = {
  height: 395,
  width: 236,
};

export const FileThumbnailSizeDefault: TThumbnailSize = {
  height: 133,
  width: 104,
};

export const IdThumbnailSize: TThumbnailSize = {
  height: 86.5,
  width: 129,
};

export const thumbnailSizes: Record<DocType, TThumbnailSize> = {
  [DocType.BirthCertificate]: ImageThumbnailSizeDefault,
  [DocType.SocialSecurityCard]: IdThumbnailSize,
  [DocType.PhotoId]: IdThumbnailSize,
};
