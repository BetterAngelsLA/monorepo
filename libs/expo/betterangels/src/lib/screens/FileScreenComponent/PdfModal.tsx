import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Modal, Pressable, SafeAreaView, View } from 'react-native';
import PDF from 'react-native-pdf';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TPdfModalProps = {
  url?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function PdfModal(props: TPdfModalProps) {
  const { url, isOpen, setIsOpen } = props;

  const insets = useSafeAreaInsets();

  if (!url) {
    return null;
  }

  return (
    <Modal
      style={{
        backgroundColor: Colors.WHITE,
      }}
      visible={isOpen}
      animationType="slide"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            position: 'absolute',
            top: insets.top + Spacings.sm,
            left: 0,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Pressable
            onPress={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center',
              right: Spacings.xxs,
              height: 40,
              width: 40,
              zIndex: 2,
            }}
            accessibilityHint="close"
            accessibilityRole="button"
          >
            <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
          </Pressable>
        </View>

        <PDF
          source={{
            uri: url,
            cache: true,
          }}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    </Modal>
  );
}
