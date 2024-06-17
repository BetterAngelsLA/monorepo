import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, Button, TextBold } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { useUser } from '../../hooks';
import InfoCard from './InfoCard';

export default function UserProfile() {
  const { user } = useUser();

  if (!user) throw new Error('Something went wrong');

  const userInfo = [
    { title: 'Email', value: user.email },
    {
      title: 'Organization',
      value:
        user.organizations && user.organizations.length > 0
          ? user.organizations.join(', ')
          : 'None',
    },
  ];

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
          size="lg"
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

        <Button
          mt="xs"
          title="Delete My Account"
          size="auto"
          variant="negative"
          accessibilityHint="deletes user's account"
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
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
  },
});
