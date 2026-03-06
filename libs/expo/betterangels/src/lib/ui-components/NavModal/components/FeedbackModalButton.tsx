import { AntDesign } from '@expo/vector-icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ActionModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

const BA_CUSTOMER_SVC_LINK =
  'https://betterangels.atlassian.net/servicedesk/customer/portal/2';

type TProps = {
  style?: ViewStyle;
};

export function FeedbackModalButton(props: TProps) {
  const { style } = props;

  const [modalVisible, setModalVisible] = useState(false);

  function onCtaPress() {
    Linking.openURL(BA_CUSTOMER_SVC_LINK);
    setModalVisible(false);
  }

  return (
    <>
      <Pressable
        accessible
        accessibilityHint="closes the modal"
        accessibilityRole="button"
        accessibilityLabel="close"
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
            ...styles.container,
          },
          style,
        ]}
      >
        <AntDesign name="comment" size={24} color={Colors.PRIMARY_EXTRA_DARK} />
        <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>Feedback</TextRegular>
      </Pressable>

      <ActionModal
        visible={modalVisible}
        body={
          <View>
            <TextBold size="lg" mb="sm">
              Submit Feedback
            </TextBold>
            <TextRegular mb="sm" color={Colors.PRIMARY_EXTRA_DARK}>
              You'll be taken to a secure external form to submit your feedback,
              where you may submit additional information or screenshots.
            </TextRegular>
          </View>
        }
        primaryButtonTitle="Continue to Form"
        onPrimaryPress={onCtaPress}
        secondaryButtonTitle="Cancel"
        onSecondaryPress={() => setModalVisible(false)}
        setVisible={setModalVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radiuses.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
});
