import type { ClientFile, FileName } from '@monorepo/expo/shared/clients';
import { FolderIcon, FolderOpenIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, FileCard } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { FileThumbnail } from '../../../../ui-components';

function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext)) return 'application/pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'heic', 'tiff'].includes(ext))
    return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return 'application/octet-stream';
}

function getFileLabel(file: ClientFile, fileNames: FileName[]): string {
  if (file.name) {
    return file.name;
  }

  if (file.ref_file_name) {
    const matchingFileName = fileNames.find(
      (fileName) => fileName.id === file.ref_file_name
    );
    if (matchingFileName) {
      return matchingFileName.name;
    }
  }

  return file.file?.filename || `Document ${file.id}`;
}

function getFileUri(file: ClientFile): string {
  return (
    file.file?.encodedThumbnailFileContent ??
    file.file?.encodedPreviewFileContent ??
    ''
  );
}

export interface HmisDocumentsProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  accordionKey: string;
  title: string;
  data: ClientFile[];
  fileNames: FileName[];
}

export default function HmisDocuments(props: HmisDocumentsProps) {
  const { expanded, setExpanded, accordionKey, title, data, fileNames } = props;

  const isExpanded = expanded === accordionKey;

  const handleFilePress = useCallback(
    (file: ClientFile, filename: string, createdAt: string) => {
      router.navigate({
        pathname: `/hmis-file/${file.id}`,
        params: {
          label: filename,
          createdAt,
        },
      });
    },
    []
  );

  return (
    <Accordion
      icon={isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
      borderWidth={1}
      borderColor={Colors.PRIMARY_LIGHT}
      borderRadius={Radiuses.xs}
      bg={Colors.PRIMARY_EXTRA_LIGHT}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isExpanded ? null : accordionKey);
      }}
      title={title}
    >
      {isExpanded && (
        <View
          style={{
            gap: Spacings.xs,
            paddingVertical: Spacings.sm,
            paddingHorizontal: Spacings.xs,
            backgroundColor: Colors.WHITE,
          }}
        >
          {data?.map((file, idx) => {
            const filename = getFileLabel(file, fileNames);
            const uri = getFileUri(file);
            const createdAt = file.file?.added_date ?? '';
            return (
              <FileCard
                key={String(file?.id ?? idx)}
                filename={filename}
                url={uri || ''}
                onPress={() => handleFilePress(file, filename, createdAt)}
                createdAt={createdAt}
                thumbnail={
                  uri ? (
                    <FileThumbnail
                      uri={uri}
                      mimeType={getMimeTypeFromFilename(filename)}
                      borderRadius={Radiuses.xxxs}
                      thumbnailSize={{
                        width: 36,
                        height: 36,
                      }}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </View>
      )}
    </Accordion>
  );
}
