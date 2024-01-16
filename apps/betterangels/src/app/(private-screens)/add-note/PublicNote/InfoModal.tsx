import { InfoIcon, XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicModal,
  BodyText,
  H1,
  IconButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

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
      <BasicModal visible={visible} setVisible={setVisible}>
        <IconButton
          style={{ alignSelf: 'flex-end' }}
          variant="transparent"
          onPress={hideModal}
          accessibilityLabel="close modal"
          accessibilityHint="closing public note information modal"
        >
          <XmarkIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
        </IconButton>
        <View style={{ paddingRight: Spacings.sm }}>
          <H1 mb="sm">About Public Note</H1>
          <BodyText>
            Public Note can be integrated to HMIS. LAHSA prefers you to enter in
            G.I.R.P method. G for Goal, I for Intervention, R for Response, and
            P for Planning. Please enter information by following the method.
          </BodyText>
        </View>
      </BasicModal>
    </>
  );
}
