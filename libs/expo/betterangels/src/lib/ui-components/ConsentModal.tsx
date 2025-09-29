import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  Button,
  Checkbox,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  DimensionValue,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignOut } from '../hooks';
import { useUpdateCurrentUserMutation } from '../providers';
import { TUser } from '../providers/user/UserContext';

interface IConsentModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  opacity?: number; // backdrop max opacity (0..1)
  vertical?: boolean; // true => slide up (default); false => slide in from right (optional)
  ml?: number; // left margin when sliding from right
  height?: DimensionValue; // ✅ instead of string | number
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  user: TUser;
}

interface CheckedItems {
  isTosChecked: boolean;
  isPrivacyPolicyChecked: boolean;
}

const DURATION = 240;

export default function ConsentModal({
  isModalVisible,
  closeModal,
  opacity = 0.5,
  vertical = true,
  ml = 0,
  height = 'auto',
  privacyPolicyUrl,
  termsOfServiceUrl,
  user,
}: IConsentModalProps) {
  const insets = useSafeAreaInsets();
  const [updateCurrentUser, { error }] = useUpdateCurrentUserMutation();
  const { signOut } = useSignOut();
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({
    isTosChecked: false,
    isPrivacyPolicyChecked: false,
  });

  const canSubmit =
    checkedItems.isPrivacyPolicyChecked && checkedItems.isTosChecked;

  const toggle = (key: keyof CheckedItems) =>
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));

  // --- Animation state (no react-native-modal) ---
  const [mounted, setMounted] = useState(isModalVisible);
  const progress = useRef(new Animated.Value(0)).current; // 0 closed -> 1 open
  const [panelH, setPanelH] = useState(520);
  const [panelW, setPanelW] = useState(360);

  useEffect(() => {
    if (isModalVisible) {
      setMounted(true);
      progress.stopAnimation();
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: DURATION,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: 0,
        duration: DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [isModalVisible, mounted, progress]);

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, Math.min(1, opacity))],
  });

  const translate = useMemo(
    () =>
      vertical
        ? {
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelH, 0],
                }),
              },
            ],
          }
        : {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelW, 0],
                }),
              },
            ],
          },
    [progress, vertical, panelH, panelW]
  );

  const submitAgreements = async () => {
    try {
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
    } catch (e) {
      console.log('Error updating user', e);
    }
  };

  const windowHeight = Dimensions.get('window').height;

  const checkboxData = [
    {
      key: 'isTosChecked' as const,
      hint: 'Accept the terms of service',
      text: 'Terms of Service',
      url: termsOfServiceUrl,
    },
    {
      key: 'isPrivacyPolicyChecked' as const,
      hint: 'Accept the privacy policy',
      text: 'Privacy Policy',
      url: privacyPolicyUrl,
    },
  ];

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none" // we handle fade/slide manually
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={closeModal}
    >
      {/* Backdrop (tap to dismiss) */}
      <Pressable
        accessibilityRole="button"
        onPress={closeModal}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000', opacity: backdropOpacity },
          ]}
        />
      </Pressable>

      {/* Sliding panel */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          vertical ? styles.bottomContainer : styles.rightContainer,
          !vertical && ml ? { marginLeft: ml } : null,
          translate,
        ]}
        onLayout={(e) => {
          const { height: h, width: w } = e.nativeEvent.layout;
          if (vertical) {
            if (h && h !== panelH) setPanelH(h);
          } else {
            if (w && w !== panelW) setPanelW(w);
          }
        }}
      >
        <View
          style={[
            styles.panel,
            vertical
              ? {
                  borderTopLeftRadius: Radiuses.xs,
                  borderTopRightRadius: Radiuses.xs,
                  paddingTop: insets.top + 10,
                  paddingBottom: insets.bottom + Spacings.xs,
                }
              : {
                  borderTopLeftRadius: Radiuses.xs,
                  borderBottomLeftRadius: Radiuses.xs,
                  paddingTop: insets.top + Spacings.md,
                  paddingBottom: insets.bottom + Spacings.md,
                },
            {
              height,
              paddingHorizontal: Spacings.md,
              backgroundColor: Colors.WHITE,
              justifyContent: 'space-between',
              flexGrow: 1,
              zIndex: 1,
            },
          ]}
        >
          <View>
            <View style={styles.header}>
              <View style={styles.handle} />
              <TextRegular size="lg" style={styles.consent}>
                Consent
              </TextRegular>
              <View style={styles.headerDivider} />
              <Image
                style={{ height: windowHeight * 0.325 }}
                resizeMode="contain"
                source={require('../../../../shared/images/consent.png')}
                accessibilityIgnoresInvertColors
              />
            </View>

            <TextBold
              size="sm"
              mb="xs"
              mt="sm"
              color={Colors.PRIMARY_EXTRA_DARK}
            >
              Welcome to:
            </TextBold>
            <TextBold size="lg" mb="xs" color={Colors.PRIMARY_EXTRA_DARK}>
              The Better Angels App
            </TextBold>
            <TextRegular size="sm" mb="md" color={Colors.PRIMARY_EXTRA_DARK}>
              Please confirm the following:
            </TextRegular>

            {checkboxData.map((item) => (
              <Checkbox
                key={item.key}
                isChecked={checkedItems[item.key]}
                isConsent
                hasBorder={false}
                onCheck={() => toggle(item.key)}
                accessibilityHint={item.hint}
                labelFirst={false}
                size="sm"
                justifyContent="flex-start"
                mb="sm"
                label={
                  <View style={styles.checkbox}>
                    <TextRegular
                      size="sm"
                      style={{ fontWeight: '400' }}
                      ml="xs"
                    >
                      I accept the{' '}
                    </TextRegular>
                    <Link style={styles.link} href={item.url}>
                      {item.text}
                    </Link>
                  </View>
                }
              />
            ))}
          </View>

          <View>
            <Button
              accessibilityHint="Submits agreement and goes to welcome screen"
              onPress={submitAgreements}
              disabled={!canSubmit}
              mb="sm"
              title="Get Started"
              size="full"
              variant="primary"
              borderWidth={0}
            />
            <Button
              accessibilityHint="Cancels agreement"
              onPress={signOut} // ← use the value, don’t call the hook here
              title="Cancel"
              size="full"
              mb="sm"
              borderWidth={0}
              variant="secondary"
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  rightContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    backgroundColor: Colors.WHITE,
  },
  consent: {
    padding: 10,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
  },
  handle: {
    width: 18,
    height: 5,
    borderRadius: 50,
    backgroundColor: '#3C3C434D',
    transform: [{ scaleX: 2 }],
    alignSelf: 'center',
    marginVertical: 5,
  },
  headerDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#3C3C434D',
    marginBottom: Spacings.sm,
  },
  checkbox: {
    flexDirection: 'row',
  },
  link: {
    fontFamily: 'Poppins',
    fontSize: FontSizes.sm.fontSize,
    textDecorationLine: 'underline',
    fontWeight: '400',
    color: '#052B73',
  },
});
