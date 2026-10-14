import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';
import { menuLabelDefaults } from './constants';

export type TMediaOptionLabels = {
  image?: string;
  camera?: string;
  file?: string;
};

type MediaPickerMenuProps = {
  labels?: TMediaOptionLabels;
  onImageOption: () => void;
  onCameraOption: () => void;
  onDocumentsOption: () => void;
  onCancel: () => void;
  style?: ViewStyle;
};

export function MediaPickerMenu(props: MediaPickerMenuProps) {
  const { labels, onImageOption, onCameraOption, onDocumentsOption, onCancel } =
    props;

  const menuLabels: Required<TMediaOptionLabels> = {
    ...menuLabelDefaults,
    ...labels,
  };

  return (
    <View testID="media-picker-menu">
      <View
        style={{
          backgroundColor: Colors.WHITE,
          marginBottom: Spacings.xs,
          borderRadius: Radiuses.xs,
          ...Shadow,
        }}
      >
        <Pressable
          testID="media-picker-image-btn"
          onPress={onImageOption}
          style={[styles.optionButton, styles.dividerBottom]}
          accessibilityRole="button"
          accessibilityHint="opens photo library"
        >
          <TextRegular color={Colors.PRIMARY}>{menuLabels.image}</TextRegular>
        </Pressable>

        <Pressable
          testID="media-picker-camera-btn"
          onPress={onCameraOption}
          style={[styles.optionButton, styles.dividerTop]}
          accessibilityRole="button"
          accessibilityHint="opens camera"
        >
          <TextRegular color={Colors.PRIMARY}>{menuLabels.camera}</TextRegular>
        </Pressable>

        <Pressable
          testID="media-picker-file-btn"
          onPress={onDocumentsOption}
          style={[styles.optionButton, styles.dividerTop]}
          accessibilityRole="button"
          accessibilityHint="opens file library"
        >
          <TextRegular color={Colors.PRIMARY}>{menuLabels.file}</TextRegular>
        </Pressable>
      </View>

      <Pressable
        testID="media-picker-cancel-btn"
        accessibilityRole="button"
        style={{
          backgroundColor: Colors.WHITE,
          borderRadius: Radiuses.xs,
          padding: Spacings.sm,
          alignItems: 'center',
          ...Shadow,
        }}
        onPress={onCancel}
      >
        <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  optionButton: {
    padding: Spacings.sm,
    alignItems: 'center',
  },
  dividerTop: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.NEUTRAL_LIGHT,
  },
  dividerBottom: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
  },
});
