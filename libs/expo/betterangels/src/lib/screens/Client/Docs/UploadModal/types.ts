import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

export interface IUploadModalProps {
  closeModal: () => void;
  bottomSection?: React.ReactNode;
  topSection?: React.ReactNode;
  opacity?: number;
  onUploadSuccess?: () => void;
  onUploadError?: () => void;
  client: ClientProfileQuery | undefined;
}

export type DocUploads = Record<
  keyof typeof ClientDocumentNamespaceEnum,
  ReactNativeFile[]
>;
