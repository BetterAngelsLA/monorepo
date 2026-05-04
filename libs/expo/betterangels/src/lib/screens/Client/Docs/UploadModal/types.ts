import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { ReactNode } from 'react';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

export interface IUploadSectionProps {
  onCancel: () => void;
  title: string;
  subtitle?: string;
  onSubmit: () => void;
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export interface IUploadModalProps {
  closeModal: () => void;
  bottomSection?: React.ReactNode;
  topSection?: React.ReactNode;
  opacity?: number;
  client: ClientProfileQuery | undefined;
}

export type DocUploads = Record<
  keyof typeof ClientDocumentNamespaceEnum,
  ReactNativeFile[]
>;

export type ITab = keyof DocUploads | undefined;
