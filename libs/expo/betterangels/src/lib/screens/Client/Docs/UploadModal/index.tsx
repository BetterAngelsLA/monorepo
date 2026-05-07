import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  MediaPicker,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as React from 'react';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import { ClientDocumentUploads } from './ClientDocumentUploads/ClientDocumentUploads';
import { useClientDocumentUpload } from './ClientDocumentUploads/useClientDocumentUpload';
import FileUploadTab from './FileUploadTab';
import { DocUploads, ITab, IUploadModalProps } from './types';

export default function UploadModal(props: IUploadModalProps) {
  const { client, closeModal, onUploadStart, onUploadSuccess, onUploadError } =
    props;

  const [tab, setTab] = React.useState<undefined | ITab>();
  const [selectedUpload, setSelectedUpload] = React.useState<{
    docType: keyof DocUploads;
    namespace: ClientDocumentNamespaceEnum;
    allowMultiple?: boolean;
  } | null>(null);

  const [docs, setDocs] = React.useState<DocUploads>({
    BirthCertificate: [],
    ConsentForm: [],
    DriversLicenseBack: [],
    DriversLicenseFront: [],
    HmisForm: [],
    IncomeForm: [],
    OtherClientDocument: [],
    OtherDocReady: [],
    OtherForm: [],
    PhotoId: [],
    SocialSecurityCard: [],
  });

  const closeTab = () => setTab(undefined);

  const handleFilesChange = (docType: keyof DocUploads) => {
    return (files: ReactNativeFile[]) => {
      setDocs((prev) => ({ ...prev, [docType]: files }));
    };
  };

  const openMediaPicker = (upload: {
    docType: keyof DocUploads;
    namespace: ClientDocumentNamespaceEnum;
    allowMultiple?: boolean;
  }) => {
    setSelectedUpload(upload);
  };

  const uploadSelectedFiles = async (newFiles: ReactNativeFile[]) => {
    if (!clientProfileId || !selectedUpload || !newFiles.length) return;

    const selectedFiles = selectedUpload.allowMultiple
      ? [...docs[selectedUpload.docType], ...newFiles]
      : [newFiles[0]];

    const namespace = selectedUpload.namespace;

    setDocs((prev) => ({
      ...prev,
      [selectedUpload.docType]: selectedFiles,
    }));

    setSelectedUpload(null);
    closeModal();
    onUploadStart?.();

    try {
      await uploadDocuments({
        clientProfileId,
        documents: selectedFiles,
        namespace,
      });

      onUploadSuccess?.();
    } catch (err) {
      console.error(`[UploadModal upload error:] ${err}`);

      onUploadError?.();

      showSnackbar({
        message: `Sorry, there was an error with the file upload.`,
        type: 'error',
      });
    }
  };

  const clientProfileId = client?.clientProfile.id;

  const TABS = {
    DriversLicenseFront: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.DriversLicenseFront}
        clientProfileId={clientProfileId}
        files={docs.DriversLicenseFront}
        onFilesChange={handleFilesChange('DriversLicenseFront')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload CA ID or CA Driver's License - Front"
      />
    ),
    DriversLicenseBack: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.DriversLicenseBack}
        clientProfileId={clientProfileId}
        files={docs.DriversLicenseBack}
        onFilesChange={handleFilesChange('DriversLicenseBack')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload CA ID or CA Driver's License - Back"
      />
    ),
    BirthCertificate: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.BirthCertificate}
        clientProfileId={clientProfileId}
        files={docs.BirthCertificate}
        onFilesChange={handleFilesChange('BirthCertificate')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Birth Certificate"
      />
    ),
    PhotoId: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.PhotoId}
        clientProfileId={clientProfileId}
        files={docs.PhotoId}
        onFilesChange={handleFilesChange('PhotoId')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Photo ID"
      />
    ),
    SocialSecurityCard: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.SocialSecurityCard}
        clientProfileId={clientProfileId}
        files={docs.SocialSecurityCard}
        onFilesChange={handleFilesChange('SocialSecurityCard')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Social Security Card"
      />
    ),
    ConsentForm: (
      <ClientDocumentUploads
        allowMultiple
        namespace={ClientDocumentNamespaceEnum.ConsentForm}
        clientProfileId={clientProfileId}
        files={docs.ConsentForm}
        onFilesChange={handleFilesChange('ConsentForm')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Consent Forms"
      />
    ),
    HmisForm: (
      <ClientDocumentUploads
        allowMultiple
        namespace={ClientDocumentNamespaceEnum.HmisForm}
        clientProfileId={clientProfileId}
        files={docs.HmisForm}
        onFilesChange={handleFilesChange('HmisForm')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload HMIS Form"
      />
    ),
    IncomeForm: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.IncomeForm}
        allowMultiple
        clientProfileId={clientProfileId}
        files={docs.IncomeForm}
        onFilesChange={handleFilesChange('IncomeForm')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Income Forms (pay stubs)"
      />
    ),
    OtherClientDocument: (
      <ClientDocumentUploads
        allowMultiple
        namespace={ClientDocumentNamespaceEnum.OtherClientDocument}
        clientProfileId={clientProfileId}
        files={docs.OtherClientDocument}
        onFilesChange={handleFilesChange('OtherClientDocument')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Other Documents"
      />
    ),
    OtherDocReady: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.OtherDocReady}
        clientProfileId={clientProfileId}
        files={docs.OtherDocReady}
        onFilesChange={handleFilesChange('OtherDocReady')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Other Doc-Ready"
      />
    ),
    OtherForm: (
      <ClientDocumentUploads
        allowMultiple
        namespace={ClientDocumentNamespaceEnum.OtherForm}
        clientProfileId={clientProfileId}
        files={docs.OtherForm}
        onFilesChange={handleFilesChange('OtherForm')}
        onClose={closeTab}
        onUploadSuccess={() => {
          closeModal();
          onUploadSuccess?.();
        }}
        onUploadError={() => {
          closeModal();
          onUploadError?.();
        }}
        title="Upload Other Forms"
      />
    ),
  };

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;
  const { uploadDocuments } = useClientDocumentUpload();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const findDoc = (namespace: ClientDocumentNamespaceEnum) => {
      const file = client?.clientProfile.docReadyDocuments?.find(
        (item) => item.namespace === namespace
      )?.file as ReactNativeFile | undefined;
      return file ? [file] : [];
    };

    setDocs((prev) => ({
      ...prev,
      DriversLicenseFront: findDoc(
        ClientDocumentNamespaceEnum.DriversLicenseFront
      ),
      DriversLicenseBack: findDoc(
        ClientDocumentNamespaceEnum.DriversLicenseBack
      ),
      SocialSecurityCard: findDoc(
        ClientDocumentNamespaceEnum.SocialSecurityCard
      ),
      BirthCertificate: findDoc(ClientDocumentNamespaceEnum.BirthCertificate),
      PhotoId: findDoc(ClientDocumentNamespaceEnum.PhotoId),
    }));
  }, [client]);

  return (
    <View
      style={{
        paddingTop: topOffset + Spacings.xs,
        backgroundColor: Colors.WHITE,
        flex: 1,
      }}
    >
      {!!tab && TABS[tab]}

      {!tab && (
        <ScrollView
          style={{
            paddingHorizontal: Spacings.sm,
            paddingBottom: 35 + bottomOffset,
          }}
        >
          <TextRegular size="sm" mb="md">
            Select the right file type and you can rename it when it's done
            (optional).
          </TextRegular>
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
      )}

      <MediaPicker
        allowMultiple={!!selectedUpload?.allowMultiple}
        isOpen={!!selectedUpload}
        onClose={() => setSelectedUpload(null)}
        onSelectionComplete={() => setSelectedUpload(null)}
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
