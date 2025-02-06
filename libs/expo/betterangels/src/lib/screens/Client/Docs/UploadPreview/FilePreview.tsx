import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { FilePdfIcon, NoteIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FileThumbnailSizeDefault,
  Spacings,
} from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import { TThumbnailSize } from '../UploadModal/types';
import DeleteButton from './DeleteButton';

export interface IFilePreview {
  file: ReactNativeFile;
  thumbnailSize?: TThumbnailSize;
  onDelete: () => void;
}

export default function FilePreview(props: IFilePreview) {
  const { file, thumbnailSize, onDelete } = props;

  const previewSize = thumbnailSize || FileThumbnailSizeDefault;

  const isPdf = file.type === 'application/pdf';

  let accessibilityHint = 'deletes the file';

  if (isPdf) {
    accessibilityHint = 'deletes the PDF file';
  }

  return (
    <View
      style={{
        position: 'relative',
        marginBottom: Spacings.sm,
        borderWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        ...previewSize,
      }}
    >
      <DeleteButton onDelete={onDelete} accessibilityHint={accessibilityHint} />

      {isPdf && <FilePdfIcon size="lg" color={Colors.NEUTRAL_DARK} />}

      {!isPdf && <NoteIcon size="lg" color={Colors.NEUTRAL_DARK} />}
    </View>
  );
}
