import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { FullThumbenailSize, Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';

import { TextBold } from '@monorepo/expo/shared/ui-components';

import { FileThumbnail } from '../FileThumbnail/FileThumbnail';

export interface IUploadPreview {
  files: ReactNativeFile[];
  onRemoveFile: (index: number) => void;
  title?: string;
}

export function FileUploadsPreview(props: IUploadPreview) {
  const { files, onRemoveFile, title } = props;

  return (
    <View style={{ paddingTop: Spacings.sm }}>
      {title && (
        <TextBold mb="sm" size="md">
          {title}
        </TextBold>
      )}

      {files.map((file, index) => {
        return (
          <View key={index} style={{ marginBottom: Spacings.md }}>
            <FileThumbnail
              uri={file.uri}
              mimeType={file.type}
              thumbnailSize={FullThumbenailSize}
              onDelete={() => onRemoveFile(index)}
            />
          </View>
        );
      })}
    </View>
  );
}
