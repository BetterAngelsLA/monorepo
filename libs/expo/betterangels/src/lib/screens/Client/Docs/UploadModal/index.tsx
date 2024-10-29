import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { CheckIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  Radiuses,
  Spacings,
  thumbnailSizes,
} from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as React from 'react';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
// import DriversLicense from './DriverLicense';
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
        title="Upload CA ID or CA Driver’s License (front)"
        {...docProps}
      />
    ),
    DriversLicenseBack: (
      <SingleDocUploads
        thumbnailSize={thumbnailSizes.PhotoId}
        docType="DriversLicenseBack"
        title="Upload CA ID or CA Driver’s License (back)"
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

    const ConsentForm = client?.clientProfile.consentFormDocuments
      ?.filter(
        (item) => item.namespace === ClientDocumentNamespaceEnum.ConsentForm
      )
      .map((item) => item.file) as ReactNativeFile[] | undefined;
    const HmisForm = client?.clientProfile.consentFormDocuments
      ?.filter(
        (item) => item.namespace === ClientDocumentNamespaceEnum.HmisForm
      )
      .map((item) => item.file) as ReactNativeFile[] | undefined;

    const IncomeForm = client?.clientProfile.consentFormDocuments
      ?.filter(
        (item) => item.namespace === ClientDocumentNamespaceEnum.IncomeForm
      )
      .map((item) => item.file) as ReactNativeFile[] | undefined;

    const OtherClientDocument = client?.clientProfile.otherDocuments
      ?.filter(
        (item) =>
          item.namespace === ClientDocumentNamespaceEnum.OtherClientDocument
      )
      .map((item) => item.file) as ReactNativeFile[] | undefined;

    setDocs({
      ...docs,
      DriversLicenseFront,
      DriversLicenseBack,
      SocialSecurityCard,
      PhotoId,
      BirthCertificate,
      ConsentForm,
      HmisForm,
      IncomeForm,
      OtherClientDocument,
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
              {/* <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor:
                      !!docs.DriversLicenseFront && !!docs.DriversLicenseBack
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.DriversLicenseFront && !!docs.DriversLicenseBack && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={
                    !!docs.DriversLicenseFront && !!docs.DriversLicenseBack
                  }
                  containerStyle={{ flex: 1 }}
                  weight="regular"
                  onPress={() => setTab('DriversLicense')}
                  height="md"
                  align="flex-start"
                  size="full"
                  variant="secondary"
                  title="CA ID or CA Driver's License"
                  accessibilityHint="opens CA Photo ID upload screen"
                />
              </View> */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor: docs.DriversLicenseFront
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.DriversLicenseFront && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={!!docs.DriversLicenseFront}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('DriversLicenseFront')}
                  height="md"
                  align="flex-start"
                  weight="regular"
                  size="full"
                  variant="secondary"
                  title="CA ID or CA Driver's License (front)"
                  accessibilityHint="opens CA Photo ID (front) upload screen"
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor: docs.PhotoId
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.PhotoId && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={!!docs.PhotoId}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('PhotoId')}
                  height="md"
                  align="flex-start"
                  weight="regular"
                  size="full"
                  variant="secondary"
                  title="Other Photo ID (e.g., out of state)"
                  accessibilityHint="opens non-CA Photo ID upload screen"
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor: docs.BirthCertificate
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.BirthCertificate && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={!!docs.BirthCertificate}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('BirthCertificate')}
                  height="md"
                  align="flex-start"
                  weight="regular"
                  size="full"
                  variant="secondary"
                  title="Birth Certificate"
                  accessibilityHint="opens Birth Certificate upload screen"
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor: docs.SocialSecurityCard
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.SocialSecurityCard && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={!!docs.SocialSecurityCard}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('SocialSecurityCard')}
                  height="md"
                  weight="regular"
                  align="flex-start"
                  size="full"
                  variant="secondary"
                  title="SSN"
                  accessibilityHint="opens Social Security Card upload screen"
                />
              </View>
            </View>
            <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
              <TextBold>Forms</TextBold>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor:
                      docs.ConsentForm && docs.ConsentForm.length > 0
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.ConsentForm && docs.ConsentForm.length > 0 && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('ConsentForm')}
                  height="md"
                  align="flex-start"
                  size="full"
                  weight="regular"
                  variant="secondary"
                  title="Consent Forms"
                  accessibilityHint="opens Consent Form upload screen"
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor:
                      docs.HmisForm && docs.HmisForm.length > 0
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.HmisForm && docs.HmisForm.length > 0 && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('HmisForm')}
                  height="md"
                  align="flex-start"
                  weight="regular"
                  size="full"
                  variant="secondary"
                  title="HMIS Form"
                  accessibilityHint="opens HMIS Form upload screen"
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor:
                      docs.IncomeForm && docs.IncomeForm.length > 0
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.IncomeForm && docs.IncomeForm.length > 0 && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('IncomeForm')}
                  height="md"
                  weight="regular"
                  align="flex-start"
                  size="full"
                  variant="secondary"
                  title="Income Forms (pay stubs)"
                  accessibilityHint="opens Income Form upload screen"
                />
              </View>
            </View>

            <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}>
              <TextBold>Others</TextBold>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: Radiuses.xxxl,
                    backgroundColor: docs.OtherClientDocument?.length
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.OtherClientDocument?.length && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('OtherClientDocument')}
                  height="md"
                  align="flex-start"
                  size="full"
                  weight="regular"
                  variant="secondary"
                  title="Other"
                  accessibilityHint="goes to 'Other Documents' upload screen"
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
