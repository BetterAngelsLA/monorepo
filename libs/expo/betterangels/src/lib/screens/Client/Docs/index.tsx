import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import UploadModal from './UploadModal';

export default function Docs({ userId }: { userId: string | undefined }) {
  const [isModalVisible, setModalVisible] = useState(false);
  return (
    <ScrollView
      style={{ paddingVertical: Spacings.lg, paddingHorizontal: Spacings.sm }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextMedium size="lg">Doc Library</TextMedium>
        <IconButton
          onPress={() => setModalVisible(true)}
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel={'add document'}
          accessibilityHint={'add a new document'}
        >
          <PlusIcon />
        </IconButton>
      </View>
      <UploadModal
        isModalVisible={isModalVisible}
        closeModal={() => setModalVisible(false)}
      />
    </ScrollView>
  );
}
