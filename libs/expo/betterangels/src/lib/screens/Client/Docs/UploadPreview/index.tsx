import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Spacings } from '@monorepo/expo/shared/static';
import { BasicInput, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TThumbnailSize } from '../UploadModal/types';
import FilePreview from './FilePreview';
import ImageFilePreview from './ImageFilePreview';

export interface IUploadPreview {
  files: ReactNativeFile[];
  onRemoveFile: (index: number) => void;
  onFilenameChange: (index: number, value: string) => void;
  thumbnailSize?: TThumbnailSize;
}

export default function UploadPreview(props: IUploadPreview) {
  const { files, thumbnailSize, onRemoveFile, onFilenameChange } = props;

  let title = 'Uploaded file';

  if (files.length > 1) {
    title = 'Uploaded files';
  }

  return (
    <View style={{ paddingTop: Spacings.sm }}>
      <TextBold mb="sm" size="md">
        {title}
      </TextBold>

      {files.map((file, index) => {
        const isImage = file.type.startsWith('image');

        return (
          <View key={index} style={{ marginBottom: Spacings.md }}>
            {isImage && (
              <ImageFilePreview
                file={file}
                thumbnailSize={thumbnailSize}
                onDelete={() => onRemoveFile(index)}
              />
            )}

            {!isImage && (
              <FilePreview
                file={file}
                thumbnailSize={thumbnailSize}
                onDelete={() => onRemoveFile(index)}
              />
            )}

            <BasicInput
              label="File Name"
              placeholder={'Enter a file name'}
              value={file.name}
              required
              errorMessage={
                !file.name.trim() ? 'file name is required' : undefined
              }
              onDelete={() => onFilenameChange(index, '')}
              onChangeText={(val) => onFilenameChange(index, val)}
            />
          </View>
        );
      })}
    </View>
  );
}
