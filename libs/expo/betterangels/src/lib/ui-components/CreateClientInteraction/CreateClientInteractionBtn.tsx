import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ReactNode, useCallback } from 'react';
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

  const router = useRouter();
  const [teamPreference] = useUserTeamPreference();

  const handleNavigateToNewNote = useCallback(() => {
    const params: Record<string, string> = {
      clientProfileId,
    };
    if (teamPreference) {
      params.team = teamPreference;
    }

    router.navigate({
      pathname: '/note/create',
      params,
    });
  }, [clientProfileId, teamPreference, router]);

  const isDisabled = !!disabled;

  if (children) {
    return (
      <Pressable
        style={[style, isDisabled && styles.buttonDisabled]}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={handleNavigateToNewNote}
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
      onPress={handleNavigateToNewNote}
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
