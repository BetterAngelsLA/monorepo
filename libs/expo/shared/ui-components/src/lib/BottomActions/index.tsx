import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { View } from 'react-native';
import Button from '../Button';

interface IBottomActionsProps {
  optionalAction?: ReactNode;
  cancel: ReactNode;
  submitTitle?: string;
  onSubmit: () => void;
  isLoading?: boolean;
  /**
   * Optional action to be displayed on the right side of the bottom actions.
   */
}

export default function BottomActions(props: IBottomActionsProps) {
  const {
    optionalAction,
    cancel,
    onSubmit,
    submitTitle = 'Submit',
    isLoading,
  } = props;

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
      {cancel}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {optionalAction}
        <Button
          loading={isLoading}
          disabled={isLoading}
          fontSize="sm"
          height="md"
          variant="primary"
          style={{ minWidth: 90 }}
          accessibilityHint="submit the form"
          title={submitTitle}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}
