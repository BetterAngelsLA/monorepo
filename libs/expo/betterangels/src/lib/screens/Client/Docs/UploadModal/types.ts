import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

export interface IUploadModalProps {
  closeModal: () => void;
  onUploadSuccess?: () => void;
  onUploadError?: () => void;
  client: ClientProfileQuery | undefined;
}

/**
 * Document types that can be uploaded from this modal. Kept in sync with the
 * doc-type rows rendered in the modal; other namespaces in
 * ClientDocumentNamespaceEnum (e.g. OtherDocReady, OtherForm) are not exposed
 * here and should be added if/when they get a row.
 */
export const UPLOADABLE_DOC_TYPES = [
  'DriversLicenseFront',
  'DriversLicenseBack',
  'PhotoId',
  'BirthCertificate',
  'SocialSecurityCard',
  'ConsentForm',
  'HmisForm',
  'IncomeForm',
  'OtherClientDocument',
] as const;

export type DocUploads = Record<
  (typeof UPLOADABLE_DOC_TYPES)[number],
  ReactNativeFile[]
>;
