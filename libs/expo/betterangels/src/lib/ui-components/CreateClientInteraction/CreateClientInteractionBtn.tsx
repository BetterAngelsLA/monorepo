import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ReactNode, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useUserTeamPreference } from '../../state';

type TProps = {
  clientProfileId: string;
  children?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function CreateClientInteractionBtn(props: TProps) {
  const {
    clientProfileId,
    children,
    disabled,
    style,
    accessibilityLabel = 'create an interaction',
    accessibilityHint = 'create new interaction',
  } = props;

  // store in a ref as it's synchronous and safest to prevent double click
  const isProcessing = useRef(false);

  const router = useRouter();
  const [teamPreference] = useUserTeamPreference();

  const handleNavigateToNewNote = useCallback(() => {
    if (isProcessing.current) {
      return;
    }

    isProcessing.current = true;

    try {
      const params: Record<string, string> = {
        clientProfileId,
      };
      if (teamPreference) {
        params.team = teamPreference;
      }

      router.navigate({
        pathname: '/add-note/new',
        params,
      });
    } finally {
      isProcessing.current = false;
    }
  }, [clientProfileId, teamPreference, router]);

  const handlePress = () => {
    if (isProcessing.current) {
      return;
    }

    handleNavigateToNewNote();
  };

  const isDisabled = disabled || isProcessing.current;

  if (children) {
    return (
      <Pressable
        style={[style, isDisabled && styles.buttonDisabled]}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={handlePress}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <IconButton
      disabled={isDisabled}
      variant="secondary"
      borderColor={Colors.WHITE}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
    >
      <PlusIcon />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.6,
  },
});
