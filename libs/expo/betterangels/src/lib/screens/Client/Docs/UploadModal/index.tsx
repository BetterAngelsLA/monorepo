import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { CheckIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
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
import BirthCertificate from './BirthCertificate';
import ConsentForms from './ConsentForms';
import DriverLicense from './DriverLicense';
import HmisForms from './HmisForms';
import IncomeForms from './IncomeForms';
import PhotoId from './PhotoId';
import SocialSecurity from './SocialSecurity';
import { Docs, ITab, IUploadModalProps } from './types';

export default function UploadModal(props: IUploadModalProps) {
  const { isModalVisible, closeModal, opacity = 0, client } = props;
  const [tab, setTab] = React.useState<undefined | ITab>();
  const [docs, setDocs] = React.useState<Docs>({
    driverLicenseFront: undefined,
    driverLicenseBack: undefined,
    birthCertificate: undefined,
    photoId: undefined,
    ssn: undefined,
    consentForms: [],
    hmisForms: [],
    incomeForms: [],
  });

  const docProps = {
    setTab,
    client,
    docs,
    setDocs,
  };

  const TABS = {
    dl: <DriverLicense {...docProps} />,
    bc: <BirthCertificate {...docProps} />,
    photoId: <PhotoId {...docProps} />,
    ssn: <SocialSecurity {...docProps} />,
    consentForms: <ConsentForms {...docProps} />,
    hmis: <HmisForms {...docProps} />,
    incomeForms: <IncomeForms {...docProps} />,
  };

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  useEffect(() => {
    const photoId = client?.clientProfile.docReadyDocuments?.find(
      (item) => item.namespace === ClientDocumentNamespaceEnum.PhotoId
    )?.file as ReactNativeFile | undefined;

    const driverLicenseFront = client?.clientProfile.docReadyDocuments?.find(
      (item) =>
        item.namespace === ClientDocumentNamespaceEnum.DriversLicenseFront
    )?.file as ReactNativeFile | undefined;

    const ssn = client?.clientProfile.docReadyDocuments?.find(
      (item) =>
        item.namespace === ClientDocumentNamespaceEnum.SocialSecurityCard
    )?.file as ReactNativeFile | undefined;

    const birthCertificate = client?.clientProfile.docReadyDocuments?.find(
      (item) => item.namespace === ClientDocumentNamespaceEnum.BirthCertificate
    )?.file as ReactNativeFile | undefined;

    const driverLicenseBack = client?.clientProfile.docReadyDocuments?.find(
      (item) =>
        item.namespace === ClientDocumentNamespaceEnum.DriversLicenseBack
    )?.file as ReactNativeFile | undefined;

    const consentForms = client?.clientProfile.consentFormDocuments
      ?.filter(
        (item) => item.namespace === ClientDocumentNamespaceEnum.ConsentForm
      )
      .map((item) => item.file) as ReactNativeFile[] | undefined;
    const hmisForms = client?.clientProfile.consentFormDocuments
      ?.filter(
        (item) => item.namespace === ClientDocumentNamespaceEnum.HmisForm
      )
      .map((item) => item.file) as ReactNativeFile[] | undefined;

    const incomeForms = client?.clientProfile.consentFormDocuments
      ?.filter(
        (item) => item.namespace === ClientDocumentNamespaceEnum.IncomeForm
      )
      .map((item) => item.file) as ReactNativeFile[] | undefined;

    setDocs({
      ...docs,
      driverLicenseFront,
      driverLicenseBack,
      ssn,
      photoId,
      birthCertificate,
      consentForms,
      hmisForms,
      incomeForms,
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
                accessibilityHint="closes the modal"
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
                      !!docs.driverLicenseFront && !!docs.driverLicenseBack
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.driverLicenseFront && !!docs.driverLicenseBack && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={
                    !!docs.driverLicenseFront && !!docs.driverLicenseBack
                  }
                  containerStyle={{ flex: 1 }}
                  weight="regular"
                  onPress={() => setTab('dl')}
                  height="md"
                  align="flex-start"
                  size="full"
                  variant="secondary"
                  title="Driver's License (front and back)"
                  accessibilityHint="goes to driver's license upload"
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
                    backgroundColor: docs.photoId
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.photoId && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={!!docs.photoId}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('photoId')}
                  height="md"
                  align="flex-start"
                  weight="regular"
                  size="full"
                  variant="secondary"
                  title="Photo ID"
                  accessibilityHint="goes to Photo ID upload"
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
                    backgroundColor: docs.birthCertificate
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.birthCertificate && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={!!docs.birthCertificate}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('bc')}
                  height="md"
                  align="flex-start"
                  weight="regular"
                  size="full"
                  variant="secondary"
                  title="Birth Certificate"
                  accessibilityHint="goes to Birth Certificate upload"
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
                    backgroundColor: docs.ssn
                      ? Colors.SUCCESS
                      : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.ssn && <CheckIcon size="sm" color={Colors.WHITE} />}
                </View>

                <Button
                  disabled={!!docs.ssn}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('ssn')}
                  height="md"
                  weight="regular"
                  align="flex-start"
                  size="full"
                  variant="secondary"
                  title="SSN"
                  accessibilityHint="goes to SSN upload"
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
                      docs.consentForms && docs.consentForms.length > 0
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.consentForms && docs.consentForms.length > 0 && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={docs.consentForms && docs.consentForms.length > 0}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('consentForms')}
                  height="md"
                  align="flex-start"
                  size="full"
                  weight="regular"
                  variant="secondary"
                  title="Consent Forms"
                  accessibilityHint="goes to consent forms upload"
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
                      docs.hmisForms && docs.hmisForms.length > 0
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.hmisForms && docs.hmisForms.length > 0 && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={docs.hmisForms && docs.hmisForms.length > 0}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('hmis')}
                  height="md"
                  align="flex-start"
                  weight="regular"
                  size="full"
                  variant="secondary"
                  title="HMIS Form"
                  accessibilityHint="goes to hmis form upload"
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
                      docs.incomeForms && docs.incomeForms.length > 0
                        ? Colors.SUCCESS
                        : Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!!docs.incomeForms && docs.incomeForms.length > 0 && (
                    <CheckIcon size="sm" color={Colors.WHITE} />
                  )}
                </View>

                <Button
                  disabled={docs.incomeForms && docs.incomeForms.length > 0}
                  containerStyle={{ flex: 1 }}
                  onPress={() => setTab('incomeForms')}
                  height="md"
                  weight="regular"
                  align="flex-start"
                  size="full"
                  variant="secondary"
                  title="Income Forms (pay stubs)"
                  accessibilityHint="goes to Income forms upload"
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
