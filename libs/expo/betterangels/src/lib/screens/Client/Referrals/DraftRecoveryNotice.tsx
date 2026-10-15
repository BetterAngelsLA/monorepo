import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useReferralDraft } from './ReferralDraftProvider';

export function DraftRecoveryNotice() {
  const { recovery, store } = useReferralDraft();
  const [failed, setFailed] = useState(false);
  if (!recovery) return null;
  return (
    <View style={{ gap: Spacings.xs, padding: Spacings.sm }}>
      <TextBold>Local draft needs attention</TextBold>
      <TextRegular>
        This app could not read your saved draft. It has been kept on this
        device. Retry, or discard it to start again. Check saved referrals first
        if a submission was interrupted.
      </TextRegular>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="tries to read the saved draft again"
        onPress={() => {
          setFailed(false);
          store.retryLoad();
        }}
      >
        <TextBold color={Colors.PRIMARY}>Retry reading draft</TextBold>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="asks before removing the unreadable local draft"
        onPress={() =>
          Alert.alert(
            'Discard unreadable draft?',
            'Its local answers cannot be recovered after deletion. Saved referrals are not changed.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Discard',
                style: 'destructive',
                onPress: () => {
                  try {
                    store.discardUnreadable();
                  } catch {
                    setFailed(true);
                  }
                },
              },
            ],
          )
        }
      >
        <TextBold color={Colors.ERROR}>Discard unreadable draft</TextBold>
      </Pressable>
      {failed && (
        <TextRegular accessibilityLiveRegion="polite" color={Colors.ERROR}>
          The draft could not be removed. Please try again.
        </TextRegular>
      )}
    </View>
  );
}
