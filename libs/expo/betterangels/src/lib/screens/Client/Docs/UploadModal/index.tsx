import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BirthCertificate from './BirthCertificate';
import ConsentForms from './ConsentForms';
import DriverLicense from './DriverLicense';
import HmisForms from './HmisForms';
import IncomeForms from './IncomeForms';
import PhotoId from './PhotoId';
import SocialSecurity from './SocialSecurity';
import { ITab } from './types';

interface IUploadModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  bottomSection?: React.ReactNode;
  topSection?: React.ReactNode;
  opacity?: number;
}

export default function UploadModal(props: IUploadModalProps) {
  const { isModalVisible, closeModal, opacity = 0 } = props;
  const [tab, setTab] = React.useState<undefined | ITab>();

  const TABS = {
    dl: <DriverLicense setTab={setTab} />,
    bc: <BirthCertificate setTab={setTab} />,
    photoId: <PhotoId setTab={setTab} />,
    ssn: <SocialSecurity setTab={setTab} />,
    consentForms: <ConsentForms setTab={setTab} />,
    hmis: <HmisForms setTab={setTab} />,
    incomeForms: <IncomeForms setTab={setTab} />,
  };

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;
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
                    backgroundColor: Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                  }}
                ></View>

                <Button
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
                    backgroundColor: Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                  }}
                ></View>

                <Button
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
                    backgroundColor: Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                  }}
                ></View>

                <Button
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
                    backgroundColor: Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                  }}
                ></View>

                <Button
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
                    backgroundColor: Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                  }}
                ></View>

                <Button
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
                    backgroundColor: Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                  }}
                ></View>

                <Button
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
                    backgroundColor: Colors.NEUTRAL_LIGHT,
                    marginRight: Spacings.xs,
                  }}
                ></View>

                <Button
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
