import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Spacings } from '@monorepo/expo/shared/static';
import { BasicInput, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import FilePreview from './FilePreview';
import ImageFilePreview from './ImageFilePreview';

export interface IUploadPreview {
  files: ReactNativeFile[];
  onRemoveFile: (index: number) => void;
  onFilenameClear: (index: number) => void;
  onFilenameChange: (index: number, value: string) => void;
}

export default function UploadPreview(props: IUploadPreview) {
  const { files, onRemoveFile, onFilenameClear, onFilenameChange } = props;

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
                onDelete={() => onRemoveFile(index)}
              />
            )}

            {!isImage && (
              <FilePreview onDelete={() => onRemoveFile(index)} file={file} />
            )}

            <BasicInput
              label="File Name"
              placeholder={'Enter a file name'}
              value={file.name}
              required
              errorMessage={
                !file.name.trim() ? 'file name is required' : undefined
              }
              onDelete={() => onFilenameClear(index)}
              onChangeText={(e) => onFilenameChange(index, e)}
            />
          </View>
        );
      })}
    </View>
  );
}
