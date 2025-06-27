import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  Radiuses,
  Spacings,
  thumbnailSizes,
} from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import * as React from 'react';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import FileUploadTab from './FileUploadTab';
import MultipleDocUploads from './MultipleDocUploads';
import SingleDocUploads from './SingleDocUploads';
import { Docs, ITab, IUploadModalProps } from './types';

export default function UploadModal(props: IUploadModalProps) {
  const { isModalVisible, closeModal, opacity = 0, client } = props;
  const [tab, setTab] = React.useState<undefined | ITab>();
  const [docs, setDocs] = React.useState<Docs>({
    DriversLicenseFront: undefined,
    DriversLicenseBack: undefined,
    BirthCertificate: undefined,
    PhotoId: undefined,
    SocialSecurityCard: undefined,
    ConsentForm: [],
    HmisForm: [],
    IncomeForm: [],
    OtherClientDocument: [],
  });

  const docProps = {
    setTab,
    client,
    docs,
    setDocs,
  };

  const TABS = {
    DriversLicenseFront: (
      <SingleDocUploads
        thumbnailSize={thumbnailSizes.PhotoId}
        docType="DriversLicenseFront"
        title="Upload CA ID or CA Driver’s License - Front"
        {...docProps}
      />
    ),
    DriversLicenseBack: (
      <SingleDocUploads
        thumbnailSize={thumbnailSizes.PhotoId}
        docType="DriversLicenseBack"
        title="Upload CA ID or CA Driver’s License - Back"
        {...docProps}
      />
    ),
    BirthCertificate: (
      <SingleDocUploads
        thumbnailSize={thumbnailSizes.BirthCertificate}
        docType="BirthCertificate"
        title="Upload Birth Certificate"
        {...docProps}
      />
    ),
    PhotoId: (
      <SingleDocUploads
        thumbnailSize={thumbnailSizes.PhotoId}
        docType="PhotoId"
        title="Upload Photo ID"
        {...docProps}
      />
    ),
    SocialSecurityCard: (
      <SingleDocUploads
        thumbnailSize={thumbnailSizes.SocialSecurityCard}
        docType="SocialSecurityCard"
        title="Upload Social Security Card"
        {...docProps}
      />
    ),
    ConsentForm: (
      <MultipleDocUploads
        docType="ConsentForm"
        title="Upload Consent Forms"
        {...docProps}
      />
    ),
    HmisForm: (
      <MultipleDocUploads
        docType="HmisForm"
        title="Upload HMIS Form"
        {...docProps}
      />
    ),
    IncomeForm: (
      <MultipleDocUploads
        docType="IncomeForm"
        title="Upload Income Forms (pay stubs)"
        {...docProps}
      />
    ),
    OtherClientDocument: (
      <MultipleDocUploads
        docType="OtherClientDocument"
        title="Upload Other Documents"
        {...docProps}
      />
    ),
  };

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  useEffect(() => {
    const PhotoId = client?.clientProfile.docReadyDocuments?.find(
      (item) => item.namespace === ClientDocumentNamespaceEnum.PhotoId
    )?.file as ReactNativeFile | undefined;

    const DriversLicenseFront = client?.clientProfile.docReadyDocuments?.find(
      (item) =>
        item.namespace === ClientDocumentNamespaceEnum.DriversLicenseFront
    )?.file as ReactNativeFile | undefined;

    const SocialSecurityCard = client?.clientProfile.docReadyDocuments?.find(
      (item) =>
        item.namespace === ClientDocumentNamespaceEnum.SocialSecurityCard
    )?.file as ReactNativeFile | undefined;

    const BirthCertificate = client?.clientProfile.docReadyDocuments?.find(
      (item) => item.namespace === ClientDocumentNamespaceEnum.BirthCertificate
    )?.file as ReactNativeFile | undefined;

    const DriversLicenseBack = client?.clientProfile.docReadyDocuments?.find(
      (item) =>
        item.namespace === ClientDocumentNamespaceEnum.DriversLicenseBack
    )?.file as ReactNativeFile | undefined;

    setDocs({
      DriversLicenseFront,
      DriversLicenseBack,
      SocialSecurityCard,
      PhotoId,
      BirthCertificate,
    });
  }, [client]);

  return (
    <Modal
      style={{
        margin: 0,
        flex: 1,
        justifyContent: 'flex-end',
      }}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={opacity}
      isVisible={isModalVisible}
      onBackdropPress={closeModal}
      useNativeDriverForBackdrop={true}
    >
      <View
        style={{
          borderTopLeftRadius: Radiuses.xs,
          borderTopRightRadius: Radiuses.xs,
          paddingTop: topOffset + Spacings.xs,

          backgroundColor: Colors.WHITE,
          flex: 1,
        }}
      >
        {tab ? (
          TABS[tab]
        ) : (
          <ScrollView
            style={{
              paddingHorizontal: Spacings.sm,
              paddingBottom: 35 + bottomOffset,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: Spacings.sm,
              }}
            >
              <TextBold size="lg">Upload Files</TextBold>
              <Pressable
                accessible
                accessibilityHint="closes the Upload modal"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={closeModal}
              >
                <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
              </Pressable>
            </View>
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
              />
              <FileUploadTab
                docs={docs}
                setTab={setTab}
                tabKey="HmisForm"
                title="HMIS Forms"
              />
              <FileUploadTab
                docs={docs}
                setTab={setTab}
                tabKey="IncomeForm"
                title="Income Forms (pay stubs)"
              />
            </View>

            <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
              <TextBold>Other</TextBold>
              <FileUploadTab
                docs={docs}
                setTab={setTab}
                tabKey="OtherClientDocument"
                title="Other Documents"
              />
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
