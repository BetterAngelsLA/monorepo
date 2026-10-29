import { Colors } from '@monorepo/expo/shared/static';
import { DiscardModal, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Cancel discards only the local draft, never a saved referral. Editing needs
 * explicit wording so discarding unsaved changes is not mistaken for deletion.
 */
export function CancelReferralButton({
  testID,
  style,
  onCancel,
  disabled = false,
  editing = false,
}: {
  testID: string;
  style?: StyleProp<ViewStyle>;
  onCancel: () => void;
  disabled?: boolean;
  editing?: boolean;
}) {
  return (
    <DiscardModal
      title={editing ? 'Discard unsaved changes?' : 'Discard referral?'}
      body={
        editing
          ? 'The saved referral will remain unchanged.'
          : 'This deletes the in-progress referral and cannot be undone.'
      }
      onDiscard={onCancel}
      button={
        <Pressable
          testID={testID}
          disabled={disabled}
          accessibilityState={{ disabled }}
          style={style}
          accessibilityRole="button"
          accessibilityLabel={
            editing ? 'cancel referral changes' : 'cancel referral'
          }
          accessibilityHint={
            editing
              ? 'asks to discard unsaved changes without deleting the saved referral'
              : 'asks to confirm discarding this referral'
          }
        >
          <TextRegular size="sm" color={Colors.PRIMARY} numberOfLines={1}>
            Cancel
          </TextRegular>
        </Pressable>
      }
    />
  );
}
