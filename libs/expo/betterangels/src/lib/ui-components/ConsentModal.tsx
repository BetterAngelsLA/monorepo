import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  BaseModal,
  Button,
  Checkbox,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { DimensionValue, Dimensions, StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignOut } from '../hooks';
import { useUpdateCurrentUserMutation } from '../providers';
import { TUser } from '../providers/user/UserContext';

interface IConsentModalProps {
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

interface CheckedItems {
  isTosChecked: boolean;
  isPrivacyPolicyChecked: boolean;
}
interface CheckboxData {
  key: keyof CheckedItems;
  accessibilityHint: string;
  linkText: string;
  url: string;
}

export default function ConsentModal({
  isModalVisible,
  opacity = 0,
  vertical = true,
  ml = 0,
  privacyPolicyUrl,
  termsOfServiceUrl,
  closeModal,
  user,
  height = 'auto',
}: IConsentModalProps) {
  const [updateCurrentUser, { error }] = useUpdateCurrentUserMutation();
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({
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
  const handleCheck = (key: 'isTosChecked' | 'isPrivacyPolicyChecked') =>
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const insets = useSafeAreaInsets();
  const topOffset = insets.top;
  const bottomOffset = insets.bottom;

  const windowHeight = Dimensions.get('window').height;

  const checkboxData: CheckboxData[] = [
    {
      key: 'isTosChecked',
      accessibilityHint: 'Accept the terms of service',
      linkText: 'Terms of Service',
      url: termsOfServiceUrl,
    },
    {
      key: 'isPrivacyPolicyChecked',
      accessibilityHint: 'Accept the privacy policy',
      linkText: 'Privacy Policy',
      url: privacyPolicyUrl,
    },
  ];

  const renderCheckboxes = () =>
    checkboxData.map((item) => (
      <Checkbox
        key={item.key}
        isChecked={checkedItems[item.key]}
        isConsent
        hasBorder={false}
        onCheck={() => handleCheck(item.key)}
        accessibilityHint={item.accessibilityHint}
        labelFirst={false}
        size="sm"
        justifyContent="flex-start"
        mb="sm"
        label={
          <View style={styles.checkbox}>
            <TextRegular size="sm" style={{ fontWeight: '400' }} ml="xs">
              I accept the{' '}
            </TextRegular>
            <Link style={styles.link} href={item.url}>
              {item.linkText}
            </Link>
          </View>
        }
      />
    ));

  return (
    <BaseModal
      title={null}
      isOpen={isModalVisible}
      onClose={closeModal}
      variant="sheet"
      direction={vertical ? 'up' : 'right'}
      panelOffset={ml}
      backdropOpacity={opacity}
      sheetTopPadding={vertical ? topOffset + 10 : 0} // <-- matches original placement
      panelStyle={{
        // Grow to top like original (or honor explicit height)
        ...(height === 'auto' ? { flexGrow: 1 } : { height }),
        borderTopLeftRadius: Radiuses.xs,
        borderTopRightRadius: Radiuses.xs,
        backgroundColor: Colors.WHITE,
      }}
      contentStyle={{
        // Stretch inner content so header/body/footer spacing matches original
        flex: 1,
        paddingTop: 0, // handle sits at true top of the card
        paddingHorizontal: Spacings.md,
        paddingBottom: bottomOffset + Spacings.xs,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <View style={styles.header}>
            {/* pull tab */}
            <View
              style={{
                width: 18,
                height: 5,
                borderRadius: 50,
                backgroundColor: '#3C3C434D',
                transform: [{ scaleX: 2 }],
                alignSelf: 'center',
                marginVertical: 5,
              }}
            />
            <TextRegular size="lg" style={styles.consent}>
              Consent
            </TextRegular>
            <View
              style={{
                height: 1,
                width: '100%',
                backgroundColor: '#3C3C434D',
                marginBottom: Spacings.sm,
              }}
            />
            <Image
              style={{ height: windowHeight * 0.325 }}
              resizeMode="contain"
              source={require('../../../../shared/images/consent.png')}
              accessibilityIgnoresInvertColors
            />
          </View>

          <TextBold size="sm" mb="xs" mt="sm" color={Colors.PRIMARY_EXTRA_DARK}>
            Welcome to:
          </TextBold>
          <TextBold size="lg" mb="xs" color={Colors.PRIMARY_EXTRA_DARK}>
            The Better Angels App
          </TextBold>
          <TextRegular size="sm" mb="md" color={Colors.PRIMARY_EXTRA_DARK}>
            Please confirm the following:
          </TextRegular>

          {renderCheckboxes()}
        </View>

        <View>
          <Button
            accessibilityHint="Submits agreement and goes to welcome screen"
            onPress={submitAgreements}
            disabled={
              !checkedItems.isPrivacyPolicyChecked || !checkedItems.isTosChecked
            }
            mb="sm"
            title="Get Started"
            size="full"
            variant="primary"
            borderWidth={0}
          />
          <Button
            accessibilityHint="Cancels agreement"
            onPress={signOut}
            title="Cancel"
            size="full"
            mb="sm"
            borderWidth={0}
            variant="secondary"
          />
        </View>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  consent: {
    padding: 10,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
  },
  link: {
    fontFamily: 'Poppins',
    fontSize: FontSizes['sm'].fontSize,
    textDecorationLine: 'underline',
    fontWeight: '400',
    color: '#052B73',
  },
});
