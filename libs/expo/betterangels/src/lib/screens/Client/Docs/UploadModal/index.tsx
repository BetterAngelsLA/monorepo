import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { MediaPicker, TextBold } from '@monorepo/expo/shared/ui-components';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useUploadProgress, useUploadSession } from '../../../../providers';
import FileUploadTab from './FileUploadTab';
import { DocUploads, IUploadModalProps } from './types';
import { UploadQueue } from './UploadQueue';
import { useClientDocumentUpload } from './useClientDocumentUpload';

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

type TRetryPayload = {
  files: ReactNativeFile[];
  namespace: ClientDocumentNamespaceEnum;
  title: string;
};

export default function UploadModal(props: IUploadModalProps) {
  const { client } = props;

  const [selectedUpload, setSelectedUpload] = useState<TUploadSelection | null>(
    null
  );
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

  const { uploadDocuments } = useClientDocumentUpload();
  const {
    begin,
    setUploadManifest,
    updateUpload,
    failUpload,
    completeUpload,
    endUpload,
  } = useUploadSession();
  const { sessions, setQueueOpen, cancelUpload } = useUploadProgress();
  // Payloads needed to retry a failed upload, keyed by session id.
  const retryPayloadRef = useRef(new Map<string, TRetryPayload>());

  const clientProfileId = client?.clientProfile.id;

  // Hide the drawer while this modal's queue is showing upload status.
  useEffect(() => {
    setQueueOpen(true);
    return () => setQueueOpen(false);
  }, [setQueueOpen]);

  // Pre-populate existing doc-ready documents so already-uploaded doc types
  // are shown as complete and cannot be overwritten.
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

  const openMediaPicker = (upload: TUploadSelection) => {
    setSelectedUpload(upload);
  };

  const runUpload = async (
    session: ReturnType<typeof begin>,
    files: ReactNativeFile[],
    namespace: ClientDocumentNamespaceEnum,
  ) => {
    try {
      await uploadDocuments({
        clientProfileId,
        documents: files,
        namespace,
        signal: session.signal,
        onManifest: (manifest) => setUploadManifest(session.id, manifest),
        onProgress: (progress) => updateUpload(session.id, progress),
      });

      completeUpload(session.id);
    } catch (err) {
      console.error(`[UploadModal upload error:] ${err}`);

      // Cancelled sessions were already removed by the cancel action. Other
      // failures stay in the queue so the user can retry or dismiss.
      if (session.isAborted()) {
        endUpload(session.id);
      } else {
        failUpload(session.id);
      }
    }
  };

  const uploadSelectedFiles = async (newFiles: ReactNativeFile[]) => {
    if (!clientProfileId || !selectedUpload || !newFiles.length) return;

    const { docType, namespace, allowMultiple = false } = selectedUpload;
    const selectedFiles = allowMultiple
      ? [...docs[docType], ...newFiles]
      : [newFiles[0]];

    setSelectedUpload(null);

    const title = DOC_TYPE_TITLES[docType];
    const session = begin(
      selectedFiles.map((file) => file.name),
      { label: title },
    );
    retryPayloadRef.current.set(session.id, {
      files: selectedFiles,
      namespace,
      title,
    });

    // Keep the modal open so the user can queue more documents; the queue
    // below shows each upload's status.
    await runUpload(session, selectedFiles, namespace);
  };

  const handleRetry = (sessionId: string) => {
    const payload = retryPayloadRef.current.get(sessionId);
    if (!payload || !clientProfileId) return;

    endUpload(sessionId);

    const session = begin(
      payload.files.map((file) => file.name),
      { label: payload.title },
    );
    retryPayloadRef.current.set(session.id, payload);

    void runUpload(session, payload.files, payload.namespace);
  };

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  return (
    <View
      style={{
        paddingTop: topOffset + Spacings.xs,
        backgroundColor: Colors.WHITE,
        flex: 1,
      }}
    >
      <ScrollView
        style={{
          paddingHorizontal: Spacings.sm,
          paddingBottom: 35 + bottomOffset,
        }}
      >
        <UploadQueue
          sessions={sessions}
          onCancel={cancelUpload}
          onRetry={handleRetry}
          onDismiss={endUpload}
        />

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
