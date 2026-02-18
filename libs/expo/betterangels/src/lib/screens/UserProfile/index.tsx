import { useMutation } from '@apollo/client/react';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  Button,
  DeleteModal,
  TextBold,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { DeleteCurrentUserDocument } from '../../apollo';
import { useSignOut, useSnackbar, useUser } from '../../hooks';
import InfoCard from './InfoCard';

export default function UserProfile() {
  const { user } = useUser();
  const { showSnackbar } = useSnackbar();

  if (!user) throw new Error('Something went wrong');

  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TextButton
          color={Colors.WHITE}
          regular
          title="Edit"
          accessibilityHint="goes to the edit user profile screen"
          onPress={() =>
            router.navigate({ pathname: `/user-profile/${user?.id}` })
          }
        />
      ),
    });
  }, [user?.id]);

  const [deleteCurrentUser] = useMutation(DeleteCurrentUserDocument);
  const userInfo = [
    { title: 'Email', value: user.email },
    {
      title: 'Organizations',
      value:
        user.organizations && user.organizations.length > 0
          ? user.organizations?.map((org) => org.name).join(', ')
          : 'None',
    },
    {
      title: 'Login method',
      value: user.isHmisUser ? 'HMIS' : 'BetterAngels',
    },
  ];

  const { signOut } = useSignOut();

  async function deleteCurrentUserFunction() {
    try {
      await deleteCurrentUser();
      router.navigate('/auth');
      signOut();
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: `Sorry, there was an error logging you out.`,
        type: 'error',
      });
    }
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacings.sm,
          padding: Spacings.sm,
          backgroundColor: Colors.WHITE,
        }}
      >
        <Avatar
          mb="xs"
          size="xl"
          accessibilityLabel="user profile image"
          accessibilityHint="user profile image"
        />
        <TextBold>
          {user?.firstName} {user?.lastName}
        </TextBold>
      </View>
      <View style={{ paddingHorizontal: Spacings.sm, gap: Spacings.xs }}>
        {userInfo.map((item, index) => (
          <InfoCard key={index} title={item.title} value={item.value} />
        ))}

        <DeleteModal
          body={`All data associated with your account will be deleted. This action cannot be undone.`}
          title={`Permanently delete your account?`}
          onDelete={deleteCurrentUserFunction}
          button={
            <Button
              mt="xs"
              title="Delete My Account"
              size="full"
              variant="negative"
              accessibilityHint="deletes user's account"
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    flex: 1,
  },
  infoBox: {
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
  },
  featureText: {
    position: 'absolute',
    bottom: Spacings.md,
    width: '100%',
    textAlign: 'center',
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
