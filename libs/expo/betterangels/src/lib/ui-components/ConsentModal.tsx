import { consentImage } from '@monorepo/expo/shared/images';
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

import { useMutation } from '@apollo/client/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { extractOperationInfoMessage } from '../apollo';
import { useSignOut, useSnackbar, useUser } from '../hooks';
import { UpdateCurrentUserDocument } from '../providers';
import { TUser } from '../providers/user/UserProvider';
import { UserProfileEdit } from '../screens/UserProfile/UserProfileEdit/UserProfileEdit';

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
  const { setUser } = useUser();
  const { showSnackbar } = useSnackbar();
  const [updateCurrentUser] = useMutation(UpdateCurrentUserDocument, {
    update: (cache, { data }) => {
      // A refused accept resolves to `OperationInfo` rather than `UserType`
      // (see apps/betterangels-backend/docs/graphql_errors.md). Nothing was
      // accepted, so the cache must not be told otherwise.
      if (data?.updateCurrentUser?.__typename === 'OperationInfo') {
        return;
      }

      // `updateCurrentUser` returns `UserType`, which Apollo normalizes under a
      // DIFFERENT cache key than the `currentUser` query's `CurrentUserType`.
      // Without writing the accepted flags into the `CurrentUserType` cache
      // object, the next query re-render (e.g. after `UserProfileEdit` saves the
      // name) would overwrite the context with the stale flags and flip
      // `accepted` back to false.
      const currentUserRef = cache.identify({
        __typename: 'CurrentUserType',
        id: user.id,
      });
      if (currentUserRef) {
        cache.modify({
          id: currentUserRef,
          fields: {
            hasAcceptedTos: () => checkedItems.isTosChecked,
            hasAcceptedPrivacyPolicy: () => checkedItems.isPrivacyPolicyChecked,
          },
        });
      }
    },
  });
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({
    isTosChecked: false,
    isPrivacyPolicyChecked: false,
  });

  const accepted = user.hasAcceptedPrivacyPolicy && user.hasAcceptedTos;

  const submitAgreements = async () => {
    const result = await updateCurrentUser({
      variables: {
        data: {
          id: user.id,
          hasAcceptedTos: checkedItems.isTosChecked,
          hasAcceptedPrivacyPolicy: checkedItems.isPrivacyPolicyChecked,
        },
      },
    });

    const { data, error } = result;

    // A refused accept comes back as a resolved `OperationInfo` (see
    // apps/betterangels-backend/docs/graphql_errors.md). Flipping the flags and
    // closing here would tell the user they accepted terms the server did not
    // record, so leave the sheet up and surface the reason.
    if (data?.updateCurrentUser?.__typename === 'OperationInfo') {
      showSnackbar({
        message:
          extractOperationInfoMessage(result, 'updateCurrentUser') ??
          'Something went wrong. Please try again.',
        type: 'error',
      });

      return;
    }

    if (!data) {
      console.log('Error updating user', error);
      return;
    }

    setUser((prev) =>
      prev
        ? {
            ...prev,
            hasAcceptedTos: checkedItems.isTosChecked,
            hasAcceptedPrivacyPolicy: checkedItems.isPrivacyPolicyChecked,
          }
        : prev,
    );

    // Accepting the agreements flips `accepted` to true, so this modal
    // transitions in place to the "Complete Your Registration" name form when
    // the user has no name yet. Only close it once registration is fully done
    // (the user already has a name); otherwise the tabs layout re-opens the
    // modal right after we close it — because it still needs the user's name —
    // and the modal visibly renders again after submitting.
    if (user.firstName && user.lastName) {
      closeModal();
    }
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
      <View key={item.key} style={styles.consentRow}>
        <Checkbox
          isChecked={checkedItems[item.key]}
          isConsent
          hasBorder={false}
          onCheck={() => handleCheck(item.key)}
          accessibilityHint={item.accessibilityHint}
          labelFirst={false}
          size="sm"
          justifyContent="flex-start"
          accessibilityRole="checkbox"
          label={
            <TextRegular size="sm" style={{ fontWeight: '400' }} ml="xs">
              I accept the
            </TextRegular>
          }
        />
        {/*
          The link is a SIBLING of the checkbox, never inside it. Two reasons:
          an interactive element nested in a `role="checkbox"` is unreadable to
          screen readers (and was invalid HTML while the row was a <button>), and
          nested hit targets mean tapping the link also toggles the box.
        */}
        <Link style={styles.link} href={item.url}>
          {item.linkText}
        </Link>
      </View>
    ));

  const renderHeader = () => (
    <>
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
      <TextRegular textAlign="center" size="lg" style={styles.consent}>
        {accepted ? 'Complete Your Registration' : 'Consent'}
      </TextRegular>

      <View
        style={{
          height: 1,
          width: '100%',
          backgroundColor: '#3C3C434D',
          marginBottom: Spacings.sm,
        }}
      />
    </>
  );

  const renderUserForm = () => (
    <View style={{ flex: 1 }}>
      {renderHeader()}
      <View
        style={{ paddingHorizontal: Spacings.md, paddingBottom: Spacings.sm }}
      >
        <TextRegular textAlign="center" size="sm">
          Add your full name so administrators can confirm your access and
          maintain accurate user records.
        </TextRegular>
      </View>
      <UserProfileEdit onSuccess={closeModal} onCancel={signOut} />
    </View>
  );

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
        marginBottom: vertical ? -bottomOffset : 0, // offset safe area on bottom when vertical
      }}
      contentStyle={{
        // Stretch inner content so header/body/footer spacing matches original
        flex: 1,
        paddingTop: 0, // handle sits at true top of the card
      }}
    >
      {accepted ? (
        renderUserForm()
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <View style={styles.header}>
              {/* pull tab */}
              {renderHeader()}

              <Image
                style={{ height: windowHeight * 0.325 }}
                contentFit="contain"
                source={consentImage}
                accessibilityIgnoresInvertColors
              />
            </View>
            <View style={{ paddingHorizontal: Spacings.md }}>
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

              {renderCheckboxes()}
            </View>
          </View>

          <View style={{ paddingHorizontal: Spacings.md }}>
            <Button
              accessibilityHint="Submits agreement and goes to welcome screen"
              onPress={submitAgreements}
              disabled={
                !checkedItems.isPrivacyPolicyChecked ||
                !checkedItems.isTosChecked
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
      )}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  consent: {
    padding: 10,
    // Must be a `useFonts` key (see FontLoader); the bare family name matches no
    // registered face and falls back to the system font on web.
    fontFamily: 'Poppins-SemiBold',
  },
  header: {
    alignItems: 'center',
  },
  /** Checkbox + its legal link as siblings; the row owns the item spacing. */
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  link: {
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes['sm'].fontSize,
    textDecorationLine: 'underline',
    color: '#052B73',
    marginLeft: Spacings.xxs,
  },
});
