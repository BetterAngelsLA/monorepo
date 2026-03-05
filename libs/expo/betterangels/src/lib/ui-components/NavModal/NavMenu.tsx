import {
  SettingsOutlineIcon,
  SignOutIcon,
  TaskListIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignOut, useUser } from '../../hooks';
import { useUserTeamPreference } from '../../state';
import { BaseButton } from './components/BaseButton';
import { CloseButton } from './components/CloseButton';
import { FeedbackModalButton } from './components/FeedbackModalButton';
import { ProfileButton } from './components/ProfileButton';
import { TaskIndicator } from './components/TaskIndicator';

interface INavModalProps {
  onRequestClose: () => void;
}

export function NavMenu(props: INavModalProps) {
  const { onRequestClose } = props;

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isHmisUser } = useUser();
  const { signOut } = useSignOut();
  const [teamPreference] = useUserTeamPreference();

  function onNavigate(path: string) {
    onRequestClose();

    router.navigate(path);
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: Spacings.md,
        paddingTop: insets.top + Spacings.xs,
      }}
    >
      <View style={styles.header}>
        <CloseButton style={{ marginLeft: 'auto' }} onPress={onRequestClose} />
      </View>

      <View>
        <ProfileButton
          onPress={() => onNavigate('/profile')}
          isHmisUser={isHmisUser}
        />

        <BaseButton onPress={() => onNavigate('/tasks')}>
          <BaseButton.Slot>
            <TaskListIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </BaseButton.Slot>

          <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>Tasks</TextRegular>
          <TaskIndicator team={teamPreference} />
        </BaseButton>

        <BaseButton onPress={() => onNavigate('/settings')}>
          <BaseButton.Slot>
            <SettingsOutlineIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </BaseButton.Slot>
          <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>Settings</TextRegular>
        </BaseButton>

        <BaseButton
          onPress={() => {
            signOut();
            onRequestClose();
          }}
        >
          <BaseButton.Slot>
            <SignOutIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </BaseButton.Slot>
          <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>Log Out</TextRegular>
        </BaseButton>
      </View>

      <View style={styles.footer}>
        <FeedbackModalButton style={{ alignSelf: 'flex-end' }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    marginBottom: Spacings.sm,
  },
  footer: {
    marginTop: 'auto',
  },
});
