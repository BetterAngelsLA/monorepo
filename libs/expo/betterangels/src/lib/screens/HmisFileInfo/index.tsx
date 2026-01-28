import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export type HmisFileInfoProps = {
  id: string;
  label?: string;
  createdAt?: string;
};

export default function HmisFileInfoScreen(props: HmisFileInfoProps) {
  const { id, label, createdAt } = props;
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: label ? 'Document' : 'Document',
    });
  }, [label, navigation]);

  return (
    <View
      style={{
        flex: 1,
        padding: Spacings.md,
        backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
      }}
    >
      <View style={styles.fileContainer}>
        <TextBold size="lg">{label || `Document ${id}`}</TextBold>
      </View>
      {!!createdAt && (
        <TextRegular textAlign="right" size="sm">
          Uploaded on {format(new Date(createdAt), 'MM/dd/yyyy')}
        </TextRegular>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  fileContainer: {
    backgroundColor: Colors.WHITE,
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    marginBottom: Spacings.xs,
  },
});
