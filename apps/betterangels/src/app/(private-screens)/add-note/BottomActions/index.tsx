import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextButton } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

export default function BottomActions() {
  const { handleSubmit } = useFormContext();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacings.md,
        paddingHorizontal: Spacings.sm,
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Colors.NEUTRAL,
      }}
    >
      <TextButton
        fontSize="sm"
        onPress={() => console.log('cancel')}
        accessibilityHint="cancels note creation"
        title="Cancel"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextButton
          mr="sm"
          fontSize="sm"
          onPress={() => console.log('save for later')}
          accessibilityHint="saves the note for later"
          title="Save for later"
        />
        <Button
          fontSize="sm"
          size="full"
          height="md"
          variant="primary"
          accessibilityHint="submit the note"
          title="Submit"
          style={{ maxWidth: 85 }}
          onPress={handleSubmit((data) => console.log('DATA: ', data))}
        />
      </View>
    </View>
  );
}
