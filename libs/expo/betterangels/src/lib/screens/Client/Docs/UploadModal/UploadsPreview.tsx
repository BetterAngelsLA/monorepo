import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Spacings, TThumbnailSize } from '@monorepo/expo/shared/static';
import { BasicInput, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { FileThumbnail } from '../../../../ui-components/FileThumbnail/FileThumbnail';

export interface IUploadPreview {
  files: ReactNativeFile[];
  onRemoveFile: (index: number) => void;
  onFilenameChange: (index: number, value: string) => void;
  thumbnailSize?: TThumbnailSize;
  documentType?: ClientDocumentNamespaceEnum;
}

export default function UploadsPreview(props: IUploadPreview) {
  const { documentType, files, onRemoveFile, onFilenameChange, thumbnailSize } =
    props;

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
        return (
          <View key={index} style={{ marginBottom: Spacings.md }}>
            <FileThumbnail
              uri={file.uri}
              thumbnailSize={thumbnailSize}
              documentType={documentType}
              onDelete={() => onRemoveFile(index)}
            />

            <BasicInput
              label="File Name"
              placeholder={'Enter a file name'}
              value={file.name}
              required
              mt="sm"
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
