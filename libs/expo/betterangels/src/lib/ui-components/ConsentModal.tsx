import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  Checkbox,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link } from 'expo-router';
import { useState } from 'react';
import { DimensionValue, Image, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignOut } from '../hooks';
import { useUpdateCurrentUserMutation } from '../providers';
import { TUser } from '../providers/user/UserContext';

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  opacity?: number;
  vertical?: boolean;
  ml?: number;
  height?: DimensionValue;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  user: TUser;
}

export default function ConsentModal(props: IMainModalProps) {
  const {
    isModalVisible,
    opacity = 0,
    vertical = false,
    ml = 0,
    height = 'auto',
    privacyPolicyUrl,
    termsOfServiceUrl,
    closeModal,
    user,
  } = props;

  const [updateCurrentUser, { error }] = useUpdateCurrentUserMutation();

  const [checkedItems, setCheckedItems] = useState({
    isTosChecked: false,
    isPrivacyPolicyChecked: false,
  });

  const submitAgreements = async () => {
    const { data } = await updateCurrentUser({
      variables: {
        data: {
          id: user.id,
          hasAcceptedTos: checkedItems.isTosChecked,
          hasAcceptedPrivacyPolicy: checkedItems.isPrivacyPolicyChecked,
        },
      },
    });
    if (!data) {
      console.log('Error updating user', error);
      return;
    }
    closeModal();
  };

  const { signOut } = useSignOut();

  const handleCheck = (key: 'isTosChecked' | 'isPrivacyPolicyChecked') => {
    setCheckedItems((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  return (
    <Modal
      style={{
        margin: 0,
        marginLeft: ml,
        flex: 1,
        justifyContent: 'flex-end',
      }}
      animationIn={vertical ? 'slideInUp' : 'slideInRight'}
      animationOut={vertical ? 'slideOutDown' : 'slideOutRight'}
      backdropOpacity={opacity}
      isVisible={isModalVisible}
      useNativeDriverForBackdrop={true}
    >
      <View
        style={{
          borderTopLeftRadius: Radiuses.md,
          borderTopRightRadius: Radiuses.md,
          paddingTop: topOffset + Spacings.xs,
          paddingHorizontal: Spacings.md,
          paddingBottom: 175 + bottomOffset,
          backgroundColor: Colors.WHITE,
          height,
        }}
      >
        <View style={styles.modalOverlay}>
          <Image
            source={require('../../../../shared/images/consent.png')}
            accessibilityIgnoresInvertColors={true}
          />
          <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>
            Welcome to BetterAngels Outreach app!
          </TextRegular>
          <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>
            Please confirm the following:
          </TextRegular>
          <Checkbox
            isChecked={checkedItems.isTosChecked}
            hasBorder
            onCheck={() => handleCheck('isTosChecked')}
            accessibilityHint={'Accept the terms of service'}
            label={
              <View style={styles.labelContainer}>
                <TextRegular ml="xs">I accept the </TextRegular>
                <Link
                  style={{ textDecorationLine: 'underline' }}
                  href={termsOfServiceUrl}
                  onPress={() => handleCheck('isTosChecked')}
                >
                  Terms of Service
                </Link>
              </View>
            }
          />
          <Checkbox
            isChecked={checkedItems.isPrivacyPolicyChecked}
            hasBorder
            onCheck={() => handleCheck('isPrivacyPolicyChecked')}
            accessibilityHint={'Accept the privacy policy'}
            label={
              <View style={styles.labelContainer}>
                <TextRegular ml="xs">I accept the </TextRegular>
                <Link
                  style={{ textDecorationLine: 'underline' }}
                  href={privacyPolicyUrl}
                  onPress={() => handleCheck('isPrivacyPolicyChecked')}
                >
                  Privacy Policy
                </Link>
              </View>
            }
          />
          <View>
            <Button
              accessibilityHint="Submits agreement and goes to welcome screen"
              onPress={submitAgreements}
              disabled={
                !checkedItems.isPrivacyPolicyChecked ||
                !checkedItems.isTosChecked
                  ? true
                  : false
              }
              title="Get Started"
              size="full"
              variant="primaryDark"
              borderWidth={0}
            />
            <Button
              accessibilityHint="Cancels agreement"
              onPress={signOut}
              title="Cancel"
              size="full"
              variant="primary"
              borderWidth={0}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    position: 'relative',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
