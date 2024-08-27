import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
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

interface CheckboxData {
  key: keyof CheckedItems; // Assuming CheckedItems is an interface for checkedItems
  accessibilityHint: string;
  labelText: string;
  linkText: string;
  url: string;
}

interface CheckedItems {
  isTosChecked: boolean;
  isPrivacyPolicyChecked: boolean;
}

export default function ConsentModal(props: IMainModalProps) {
  const {
    isModalVisible,
    opacity = 0,
    vertical = true,
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

  const checkboxData: CheckboxData[] = [
    {
      key: 'isTosChecked',
      accessibilityHint: 'Accept the terms of service',
      labelText: 'I accept the',
      linkText: 'Terms of Service',
      url: termsOfServiceUrl,
    },
    {
      key: 'isPrivacyPolicyChecked',
      accessibilityHint: 'Accept the privacy policy',
      labelText: 'I accept the',
      linkText: 'Privacy Policy',
      url: privacyPolicyUrl,
    },
  ];

  const renderCheckboxes = () => {
    return checkboxData.map((item) => (
      <Checkbox
        key={item.key}
        isChecked={checkedItems[item.key]}
        isConsent={true}
        hasBorder={false}
        onCheck={() => handleCheck(item.key)}
        accessibilityHint={item.accessibilityHint}
        labelFirst={false}
        size="sm"
        justifyContent="flex-start"
        mb="sm"
        label={
          <View style={styles.labelContainer}>
            <TextRegular size="sm" style={{ fontWeight: '400' }} ml="xs">
              I accept the{' '}
            </TextRegular>
            <Link
              style={styles.link}
              href={item.url}
              onPress={() => handleCheck(item.key)}
            >
              {item.linkText}
            </Link>
          </View>
        }
      />
    ));
  };

  return (
    <Modal
      style={{
        margin: 0,
        marginLeft: ml,
        flex: 1,
        flexDirection: 'column',
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
          zIndex: 1,
          borderTopLeftRadius: Radiuses.md,
          borderTopRightRadius: Radiuses.md,
          paddingHorizontal: Spacings.md,
          paddingBottom: 175 + bottomOffset,
          backgroundColor: Colors.WHITE,
          height,
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={{
              width: 18,
              height: 5,
              borderRadius: 50,
              backgroundColor: Colors.GRAY_PRESSED,
              transform: [{ scaleX: 2 }],
              alignSelf: 'center',
              marginVertical: 5,
            }}
          />
          <TextRegular size={'lg'} style={styles.consent}>
            Consent
          </TextRegular>
          <View
            style={{
              height: 1,
              width: '100%',
              backgroundColor: Colors.GRAY_PRESSED,
            }}
          />
          <Image
            source={require('../../../../shared/images/consent.png')}
            accessibilityIgnoresInvertColors={true}
          />
        </View>
        <TextRegular
          size={'sm'}
          mb="xs"
          style={{
            fontFamily: 'Poppins',
            fontWeight: '500',
          }}
          color={Colors.PRIMARY_EXTRA_DARK}
        >
          Welcome to
        </TextRegular>
        <TextRegular
          size={'lg'}
          mb="xs"
          color={Colors.PRIMARY_EXTRA_DARK}
          style={{
            fontFamily: 'Poppins',
            fontWeight: '600',
          }}
        >
          BetterAngels Outreach app!
        </TextRegular>
        <TextRegular
          size={'sm'}
          mb="md"
          color={Colors.PRIMARY_EXTRA_DARK}
          style={{
            fontWeight: '400',
          }}
        >
          Please confirm the following:
        </TextRegular>
        {renderCheckboxes()}
        <View style={styles.buttons}>
          <Button
            accessibilityHint="Submits agreement and goes to welcome screen"
            onPress={submitAgreements}
            disabled={
              !checkedItems.isPrivacyPolicyChecked || !checkedItems.isTosChecked
                ? true
                : false
            }
            mt="lg"
            title="Get Started"
            size="full"
            variant="primary"
            borderWidth={0}
          />
          <Button
            mt="xl"
            accessibilityHint="Cancels agreement"
            onPress={signOut}
            title="Cancel"
            size="full"
            borderWidth={0}
            variant="secondary"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  consent: {
    padding: 10,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  modalOverlay: {
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
  },
  buttons: {
    flex: 1,
    position: 'relative',
    bottom: -40,
  },
  link: {
    fontFamily: 'Poppins',
    fontSize: FontSizes['sm'].fontSize,
    textDecorationLine: 'underline',
    fontWeight: '400',
    color: Colors.PRIMARY,
  },
});
