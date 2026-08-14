import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  MediaPicker,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import UploadStage, {
  TUploadSelection as TUploadStageSelection,
} from '../UploadStage/UploadStage';
import FileUploadTab from './FileUploadTab';
import { DocUploads, IUploadModalProps } from './types';

type TUploadSelection = {
  docType: keyof DocUploads;
  namespace: ClientDocumentNamespaceEnum;
  allowMultiple?: boolean;
};

const DOC_TYPE_TITLES: Record<keyof DocUploads, string> = {
  DriversLicenseFront: 'CA ID or CA Driver’s License - Front',
  DriversLicenseBack: 'CA ID or CA Driver’s License - Back',
  PhotoId: 'Other Photo ID (e.g., out of state)',
  BirthCertificate: 'Birth Certificate',
  SocialSecurityCard: 'Social Security Card',
  ConsentForm: 'Consent Forms',
  HmisForm: 'HMIS Forms',
  IncomeForm: 'Income Forms (pay stubs)',
  OtherClientDocument: 'Other Documents',
};

export default function UploadModal(props: IUploadModalProps) {
  const { client, closeModal } = props;

  const [selectedUpload, setSelectedUpload] = useState<TUploadSelection | null>(
    null,
  );
  const [pendingUpload, setPendingUpload] =
    useState<TUploadStageSelection | null>(null);
  const [docs, setDocs] = useState<DocUploads>({
    BirthCertificate: [],
    ConsentForm: [],
    DriversLicenseBack: [],
    DriversLicenseFront: [],
    HmisForm: [],
    IncomeForm: [],
    OtherClientDocument: [],
    PhotoId: [],
    SocialSecurityCard: [],
  });

  const clientProfileId = client?.clientProfile.id;

  // Pre-populate existing doc-ready documents so already-uploaded doc types
  // are shown as complete and cannot be overwritten.
  useEffect(() => {
    const findDoc = (namespace: ClientDocumentNamespaceEnum) => {
      const file = client?.clientProfile.docReadyDocuments?.find(
        (item) => item.namespace === namespace,
      )?.file as ReactNativeFile | undefined;
      return file ? [file] : [];
    };

    setDocs((prev) => ({
      ...prev,
      DriversLicenseFront: findDoc(
        ClientDocumentNamespaceEnum.DriversLicenseFront,
      ),
      DriversLicenseBack: findDoc(
        ClientDocumentNamespaceEnum.DriversLicenseBack,
      ),
      SocialSecurityCard: findDoc(
        ClientDocumentNamespaceEnum.SocialSecurityCard,
      ),
      BirthCertificate: findDoc(ClientDocumentNamespaceEnum.BirthCertificate),
      PhotoId: findDoc(ClientDocumentNamespaceEnum.PhotoId),
    }));
  }, [client]);

  const openMediaPicker = (upload: TUploadSelection) => {
    setSelectedUpload(upload);
  };

  const uploadSelectedFiles = async (newFiles: ReactNativeFile[]) => {
    if (!clientProfileId || !selectedUpload || !newFiles.length) return;

    const { docType, namespace, allowMultiple = false } = selectedUpload;
    const selectedFiles = allowMultiple
      ? [...docs[docType], ...newFiles]
      : [newFiles[0]];

    setSelectedUpload(null);

    // The form is a picker: hand the files to the upload stage, which lets
    // the user review them before anything is uploaded.
    setPendingUpload({
      namespace,
      title: DOC_TYPE_TITLES[docType],
      files: selectedFiles,
    });
  };

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  if (pendingUpload) {
    return (
      <UploadStage
        clientProfileId={clientProfileId}
        selection={pendingUpload}
        closeModal={closeModal}
      />
    );
  }

  return (
    <View
      style={{
        paddingTop: topOffset + Spacings.xs,
        backgroundColor: Colors.WHITE,
        flex: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacings.sm,
          paddingBottom: Spacings.sm,
        }}
      >
        <TextBold size="lg">Upload Files</TextBold>
        <TextButton
          title="Done"
          onPress={closeModal}
          accessibilityHint="Closes the upload form"
        />
      </View>

      <TextRegular
        size="xs"
        color={Colors.NEUTRAL}
        style={{
          paddingHorizontal: Spacings.sm,
          marginBottom: Spacings.sm,
        }}
      >
        You can upload several documents at once — you'll review them before
        uploading.
      </TextRegular>

      <ScrollView
        style={{
          paddingHorizontal: Spacings.sm,
          paddingBottom: 35 + bottomOffset,
        }}
      >
        <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
          <TextBold>Doc-Ready</TextBold>
          <FileUploadTab
            docs={docs}
            tabKey="DriversLicenseFront"
            title="CA ID or CA Driver’s License - Front"
            onPress={() =>
              openMediaPicker({
                docType: 'DriversLicenseFront',
                namespace: ClientDocumentNamespaceEnum.DriversLicenseFront,
              })
            }
          />
          <FileUploadTab
            docs={docs}
            tabKey="DriversLicenseBack"
            title="CA ID or CA Driver’s License - Back"
            onPress={() =>
              openMediaPicker({
                docType: 'DriversLicenseBack',
                namespace: ClientDocumentNamespaceEnum.DriversLicenseBack,
              })
            }
          />
          <FileUploadTab
            docs={docs}
            tabKey="PhotoId"
            title="Other Photo ID (e.g., out of state)"
            onPress={() =>
              openMediaPicker({
                docType: 'PhotoId',
                namespace: ClientDocumentNamespaceEnum.PhotoId,
              })
            }
          />
          <FileUploadTab
            docs={docs}
            tabKey="BirthCertificate"
            title="Birth Certificate"
            onPress={() =>
              openMediaPicker({
                docType: 'BirthCertificate',
                namespace: ClientDocumentNamespaceEnum.BirthCertificate,
              })
            }
          />
          <FileUploadTab
            docs={docs}
            tabKey="SocialSecurityCard"
            title="Social Security Card"
            onPress={() =>
              openMediaPicker({
                docType: 'SocialSecurityCard',
                namespace: ClientDocumentNamespaceEnum.SocialSecurityCard,
              })
            }
          />
        </View>

        <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
          <TextBold>Forms</TextBold>
          <FileUploadTab
            docs={docs}
            tabKey="ConsentForm"
            title="Consent Forms"
            allowMultiple
            onPress={() =>
              openMediaPicker({
                docType: 'ConsentForm',
                namespace: ClientDocumentNamespaceEnum.ConsentForm,
                allowMultiple: true,
              })
            }
          />
          <FileUploadTab
            docs={docs}
            tabKey="HmisForm"
            title="HMIS Forms"
            allowMultiple
            onPress={() =>
              openMediaPicker({
                docType: 'HmisForm',
                namespace: ClientDocumentNamespaceEnum.HmisForm,
                allowMultiple: true,
              })
            }
          />
          <FileUploadTab
            docs={docs}
            tabKey="IncomeForm"
            title="Income Forms (pay stubs)"
            allowMultiple
            onPress={() =>
              openMediaPicker({
                docType: 'IncomeForm',
                namespace: ClientDocumentNamespaceEnum.IncomeForm,
                allowMultiple: true,
              })
            }
          />
        </View>

        <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
          <TextBold>Other</TextBold>
          <FileUploadTab
            docs={docs}
            tabKey="OtherClientDocument"
            title="Other Documents"
            allowMultiple
            onPress={() =>
              openMediaPicker({
                docType: 'OtherClientDocument',
                namespace: ClientDocumentNamespaceEnum.OtherClientDocument,
                allowMultiple: true,
              })
            }
          />
        </View>
      </ScrollView>

      <MediaPicker
        allowMultiple={!!selectedUpload?.allowMultiple}
        isOpen={!!selectedUpload}
        onClose={() => setSelectedUpload(null)}
        onCameraCapture={(file) => {
          uploadSelectedFiles([file]);
        }}
        onFilesSelected={(files) => {
          uploadSelectedFiles(files);
        }}
      />
    </View>
  );
}
