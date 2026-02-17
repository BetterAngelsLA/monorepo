import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { FullThumbenailSize, Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';

import { TextBold } from '@monorepo/expo/shared/ui-components';

import { FileThumbnail } from '../FileThumbnail/FileThumbnail';

export interface IUploadPreview {
  files: ReactNativeFile[];
  onRemoveFile: (index: number) => void;
  title?: string;
  disabled?: boolean;
}

export function FileUploadsPreview(props: IUploadPreview) {
  const { files, onRemoveFile, title, disabled } = props;

  return (
    <View
      style={{
        paddingTop: Spacings.sm,
      }}
    >
      {title && (
        <TextBold mb="sm" size="md">
          {title}
        </TextBold>
      )}

      {files.map((file, index) => {
        const isImage = file.type.startsWith('image');

        return (
          <View
            key={index}
            style={{
              marginBottom: Spacings.md,
            }}
          >
            <FileThumbnail
              disabled={disabled}
              uri={file.uri}
              mimeType={file.type}
              thumbnailSize={isImage ? FullThumbenailSize : undefined}
              onDelete={() => onRemoveFile(index)}
            />
          </View>
        );
      })}
    </View>
  );
}
