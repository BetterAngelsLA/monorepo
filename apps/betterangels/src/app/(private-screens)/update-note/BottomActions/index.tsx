import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextButton } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import CancelModal from './CancelModal';

interface IBottomActionsProps {
  updateNoteFunction;
}

export default function BottomActions(props: IBottomActionsProps) {
  const { handleSubmit } = useFormContext();
  const { updateNoteFunction } = props;

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
      <CancelModal />
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
          onPress={handleSubmit(updateNoteFunction)}
          // onPress={handleSubmit((data) => console.log('DATA: ', data))}
        />
      </View>
    </View>
  );
}
