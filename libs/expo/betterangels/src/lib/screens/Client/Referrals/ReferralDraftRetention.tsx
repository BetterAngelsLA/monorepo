import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import {
  discardAccountReferralDrafts,
  type ReferralDraftAccount,
} from './referralDraftStorage';

export function ReferralDraftRetention({
  account,
}: {
  account: ReferralDraftAccount;
}) {
  const identity = JSON.stringify([
    account.apiUrl.replace(/\/+$/, ''),
    account.userId,
  ]);
  const lifetime = useRef<object | null>(null);
  const [result, setResult] = useState<{ identity: string; message: string }>();
  useLayoutEffect(() => {
    // An old native alert must not survive an account/environment switch,
    // including switching away and back to the same identity.
    const token = {};
    lifetime.current = token;
    return () => {
      if (lifetime.current === token) lifetime.current = null;
    };
  }, [identity]);
  const message = result?.identity === identity ? result.message : '';
  return (
    <View style={{ gap: Spacings.xs }}>
      <TextRegular>
        Referral drafts stay on this device after sign-out. Only this account in
        this environment can resume them. You can remove them here when
        finished.
      </TextRegular>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="asks before deleting this account's local referral drafts"
        onPress={() => {
          const token = lifetime.current;
          Alert.alert(
            'Remove your local referral drafts?',
            'This removes your drafts across organizations in this environment. Saved referrals and other accounts are not changed. If a submission was interrupted, check the referral list before creating another.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove drafts',
                style: 'destructive',
                onPress: () => {
                  if (!token || lifetime.current !== token) return;
                  try {
                    discardAccountReferralDrafts(account);
                    setResult({
                      identity,
                      message: 'Your local referral drafts were removed.',
                    });
                  } catch {
                    setResult({
                      identity,
                      message:
                        'Some drafts could not be removed. Please try again.',
                    });
                  }
                },
              },
            ],
          );
        }}
      >
        <TextBold color={Colors.ERROR}>
          Remove my local referral drafts
        </TextBold>
      </Pressable>
      {!!message && (
        <TextRegular accessibilityLiveRegion="polite">{message}</TextRegular>
      )}
    </View>
  );
}
