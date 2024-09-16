import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

export interface IUploadSectionProps {
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

export interface IIdDocUploadsProps {
  setTab: (tab: ITab) => void;
  client: ClientProfileQuery | undefined;
  docs: Docs;
  setDocs: Dispatch<SetStateAction<Docs>>;
  title: string;
  docType: 'SocialSecurityCard' | 'PhotoId';
}

export interface IDocumentUploadProps {
  setTab: (tab: ITab) => void;
  client: ClientProfileQuery | undefined;
  docs: Docs;
  setDocs: Dispatch<SetStateAction<Docs>>;
  title: string;
  allowMultiple: boolean;
  // docType: 'ConsentForm' | 'HmisForm' | 'IncomeForm';
  thumbnailSize: TThumbnailSize;
  docType:
    | 'BirthCertificate'
    | 'SocialSecurityCard'
    | 'PhotoId'
    | 'ConsentForm'
    | 'HmisForm'
    | 'IncomeForm';
}

export interface ISingleDocUploadsProps {
  setTab: (tab: ITab) => void;
  client: ClientProfileQuery | undefined;
  docs: Docs;
  setDocs: Dispatch<SetStateAction<Docs>>;
  title: string;
  docType: 'BirthCertificate' | 'SocialSecurityCard' | 'PhotoId';
  thumbnailSize: TThumbnailSize;
}

export type TThumbnailSize = {
  height: number;
  width: number;
};

export type Docs = {
  DriversLicenseFront: ReactNativeFile | undefined;
  DriversLicenseBack: ReactNativeFile | undefined;
  BirthCertificate: ReactNativeFile | undefined;
  PhotoId: ReactNativeFile | undefined;
  SocialSecurityCard: ReactNativeFile | undefined;
  ConsentForm: ReactNativeFile[] | undefined;
  HmisForm: ReactNativeFile[] | undefined;
  IncomeForm: ReactNativeFile[] | undefined;
};

export type ITab =
  | 'DriversLicense'
  | 'BirthCertificate'
  | 'PhotoId'
  | 'SocialSecurityCard'
  | 'ConsentForm'
  | 'HmisForm'
  | 'IncomeForm'
  | undefined;
