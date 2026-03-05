import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { BaseModal } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { NavMenu } from './NavMenu';
import { MenuButton } from './components/MenuButton';

export function NavModal() {
  const [isModalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <MenuButton onPress={openModal} />

      <BaseModal
        backdropOpacity={0.5}
        isOpen={isModalVisible}
        onClose={closeModal}
        variant="sheet"
        direction="right"
        panelStyle={{
          borderTopLeftRadius: Radiuses.xs,
          borderTopRightRadius: Radiuses.xs,
          backgroundColor: Colors.WHITE,
          height: '100%',
        }}
        contentStyle={{
          flex: 1,
        }}
        sheetTopPadding={0}
      >
        <NavMenu onRequestClose={closeModal} />
      </BaseModal>
    </>
  );
}
