import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { ReactNode } from 'react';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

export interface ISectionProps {
  onCancel: () => void;
  title: string;
  subtitle?: string;
  onSubmit: () => void;
  children: ReactNode;
  loading?: boolean;
}

export interface IUploadModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  bottomSection?: React.ReactNode;
  topSection?: React.ReactNode;
  opacity?: number;
  client: ClientProfileQuery | undefined;
}

export type Docs = {
  driverLicenseFront: ReactNativeFile | undefined;
  driverLicenseBack: ReactNativeFile | undefined;
  birthCertificate: ReactNativeFile | undefined;
  photoId: ReactNativeFile | undefined;
  ssn: ReactNativeFile | undefined;
  consentForms: ReactNativeFile[] | undefined;
  hmisForms: ReactNativeFile[] | undefined;
  incomeForms: ReactNativeFile[] | undefined;
};

export type ITab =
  | 'dl'
  | 'bc'
  | 'photoId'
  | 'ssn'
  | 'consentForms'
  | 'hmis'
  | 'incomeForms'
  | undefined;
