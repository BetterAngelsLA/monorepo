import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import * as React from 'react';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { ClientDocumentUploads } from './ClientDocumentUploads/ClientDocumentUploads';
import FileUploadTab from './FileUploadTab';
import { DocUploads, ITab, IUploadModalProps } from './types';

export default function UploadModal(props: IUploadModalProps) {
  const { client } = props;

  const [tab, setTab] = React.useState<undefined | ITab>();
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

  const clientProfileId = client?.clientProfile.id;

  const TABS = {
    DriversLicenseFront: (
      <ClientDocumentUploads
        namespace={ClientDocumentNamespaceEnum.DriversLicenseFront}
        clientProfileId={clientProfileId}
        files={docs.DriversLicenseFront}
        onFilesChange={handleFilesChange('DriversLicenseFront')}
        onClose={closeTab}
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
        title="Upload Other Forms"
      />
    ),
  };

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

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
              setTab={setTab}
              tabKey="DriversLicenseFront"
              title="CA ID or CA Driver’s License - Front"
            />
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="DriversLicenseBack"
              title="CA ID or CA Driver’s License - Back"
            />
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="PhotoId"
              title="Other Photo ID (e.g., out of state)"
            />
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="BirthCertificate"
              title="Birth Certificate"
            />
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="SocialSecurityCard"
              title="Social Security Card"
            />
          </View>

          <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
            <TextBold>Forms</TextBold>
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="ConsentForm"
              title="Consent Forms"
              allowMultiple
            />
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="HmisForm"
              title="HMIS Forms"
              allowMultiple
            />
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="IncomeForm"
              title="Income Forms (pay stubs)"
              allowMultiple
            />
          </View>

          <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
            <TextBold>Other</TextBold>
            <FileUploadTab
              docs={docs}
              setTab={setTab}
              tabKey="OtherClientDocument"
              title="Other Documents"
              allowMultiple
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
