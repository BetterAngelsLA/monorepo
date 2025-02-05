import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { FilePdfIcon, NoteIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import DeleteButton from './DeleteButton';

export interface IFilePreview {
  file: ReactNativeFile;
  onDelete: () => void;
}

export default function FilePreview(props: IFilePreview) {
  const { file, onDelete } = props;

  const isPdf = file.type === 'application/pdf';

  let accessibilityHint = 'deletes the file';

  if (isPdf) {
    accessibilityHint = 'deletes the PDF file';
  }

  return (
    <View
      style={{
        position: 'relative',
        height: 133,
        width: 104,
        marginBottom: Spacings.sm,
        borderWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <DeleteButton onDelete={onDelete} accessibilityHint={accessibilityHint} />

      {isPdf && <FilePdfIcon size="lg" color={Colors.NEUTRAL_DARK} />}

      {!isPdf && <NoteIcon size="lg" color={Colors.NEUTRAL_DARK} />}
    </View>
  );
}
