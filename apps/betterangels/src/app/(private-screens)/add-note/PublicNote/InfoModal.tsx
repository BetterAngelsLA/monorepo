import { InfoIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable } from 'react-native';

export default function InfoModal() {
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    setVisible(true);
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
        <TextBold size="xl" mb="sm">
          About Public Note
        </TextBold>
        <TextRegular>
          Public Note can be integrated to HMIS. LAHSA prefers you to enter in
          G.I.R.P method. G for Goal, I for Intervention, R for Response, and P
          for Planning. Please enter information by following the method.
        </TextRegular>
      </BasicModal>
    </>
  );
}
