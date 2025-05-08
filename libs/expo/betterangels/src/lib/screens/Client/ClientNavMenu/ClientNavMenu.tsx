import { DeleteIcon, ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { useDeleteClientProfile } from '../ClientProfile/hooks/useDeleteClientProfile';
import { ClientNavMenuBtn } from './ClientNavMenuBtn';

type TProps = {
  clientProfileId?: string;
};
export function ClientNavMenu(props: TProps) {
  const { clientProfileId } = props;

  const [visible, setVisible] = useState(false);

  const { deleteProfile, loading: isDeleting } =
    useDeleteClientProfile(clientProfileId);

  const onDeleteClientProfile = async () => {
    if (!clientProfileId || isDeleting) {
      return;
    }

    await deleteProfile(clientProfileId);
  };

  return (
    <Tooltip
      isVisible={visible}
      backgroundColor="transparent"
      arrowSize={{
        width: 0,
        height: 0,
      }}
      placement="bottom"
      displayInsets={{
        top: 0,
        bottom: 0,
        left: 0,
        right: 12,
      }}
      disableShadow={true}
      tooltipStyle={styles.contentWrapper}
      contentStyle={styles.content}
      content={
        <>
          {clientProfileId && (
            <ClientNavMenuBtn
              disabled={isDeleting}
              text="Delete Profile"
              accessibilityHint="delete client profile"
              color={Colors.ERROR}
              onClick={async () => {
                setVisible(false);
                onDeleteClientProfile();
              }}
              icon={<DeleteIcon color={Colors.ERROR} size="sm" />}
            />
          )}
        </>
      }
      onClose={() => setVisible(false)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityHint="toggle client profile menu"
        onPress={() => setVisible(true)}
      >
        {({ pressed }) => (
          <ThreeDotIcon
            size="lg"
            color={pressed ? Colors.NEUTRAL_DARK : Colors.WHITE}
          />
        )}
      </Pressable>
    </Tooltip>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    marginTop: 8,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    borderRadius: 12,
  },
  content: {
    padding: 0,
    borderRadius: 12,
    height: 'auto',
    overflow: 'hidden',
  },
});
