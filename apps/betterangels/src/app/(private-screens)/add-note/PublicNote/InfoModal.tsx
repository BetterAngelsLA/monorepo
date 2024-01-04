import { hexToRGBA } from '@monorepo/expo/betterangels';
import { InfoIcon, XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, H1, IconButton } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

export default function InfoModal() {
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  return (
    <>
      <Pressable
        style={{ marginLeft: Spacings.xs }}
        onPress={showModal}
        accessible
        accessibilityLabel="Public note information"
        accessibilityHint="information about public note"
      >
        <InfoIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
      </Pressable>
      <Modal transparent visible={visible} onDismiss={hideModal}>
        <Pressable
          accessibilityRole="button"
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hexToRGBA(Colors.NEUTRAL_EXTRA_DARK, 0.95),
            paddingHorizontal: Spacings.sm,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.WHITE,
              paddingHorizontal: Spacings.md,
              paddingTop: 61,
              paddingBottom: Spacings.xl,
              borderRadius: 8,
            }}
          >
            <IconButton
              style={{
                position: 'absolute',
                top: 18,
                right: 10,
                backgroundColor: Colors.BLACK,
              }}
              variant="transparent"
              onPress={hideModal}
              accessibilityLabel="close modal"
              accessibilityHint="closing public note information modal"
            >
              <XmarkIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
            </IconButton>
            <H1 mb="sm">About Public Note</H1>
            <BodyText>
              Public Note can be integrated to HMIS. LAHSA prefers you to enter
              in G.I.R.P method. G for Goal, I for Intervention, R for Response,
              and P for Planning. Please enter information by following the
              method.
            </BodyText>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
