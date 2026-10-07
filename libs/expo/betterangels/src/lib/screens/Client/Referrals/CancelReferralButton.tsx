import { Colors } from '@monorepo/expo/shared/static';
import { DiscardModal, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Cancel abandons the in-progress referral, so it goes through the same
 * confirmation the draft card's Discard uses. Resuming a draft and cancelling
 * must not silently destroy the answers the user came back for.
 */
export function CancelReferralButton({
  testID,
  style,
  onCancel,
}: {
  testID: string;
  style?: StyleProp<ViewStyle>;
  onCancel: () => void;
}) {
  return (
    <DiscardModal
      title="Discard referral?"
      body="This deletes the in-progress referral and cannot be undone."
      onDiscard={onCancel}
      button={
        <Pressable
          testID={testID}
          style={style}
          accessibilityRole="button"
          accessibilityLabel="cancel referral"
          accessibilityHint="asks to confirm discarding this referral"
        >
          <TextRegular size="sm" color={Colors.PRIMARY}>
            Cancel
          </TextRegular>
        </Pressable>
      }
    />
  );
}
