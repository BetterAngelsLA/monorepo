import type { ClientFile } from '@monorepo/expo/shared/clients';
import { FolderIcon, FolderOpenIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, FileCard, TextMedium, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { FileThumbnail, Modal } from '../../../../ui-components';

function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext)) return 'application/pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'heic', 'tiff'].includes(ext))
    return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return 'application/octet-stream';
}

function getFileLabel(file: ClientFile, index: number): string {
  return (
    file.file?.filename ||
    file.fileName?.name ||
    file.name ||
    (file.id ? `Document ${file.id}` : `Document ${index + 1}`)
  );
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
}

export default function HmisDocuments(props: HmisDocumentsProps) {
  const { expanded, setExpanded, accordionKey, title, data } = props;
  const [selectedFile, setSelectedFile] = useState<ClientFile | null>(null);

  const isExpanded = expanded === accordionKey;

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
          {data?.map((file, index) => {
            const filename = getFileLabel(file, index);
            const uri = getFileUri(file);
            const createdAt = file.file?.added_date ?? '';
            return (
              <FileCard
                key={String(file?.id ?? index)}
                filename={filename}
                url={uri || ''}
                onPress={() => setSelectedFile(file)}
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

      {!!selectedFile && (
        <Modal
          isModalVisible={!!selectedFile}
          closeModal={() => setSelectedFile(null)}
          closeButton
        >
          <View style={{ padding: Spacings.md, gap: Spacings.sm }}>
            <TextMedium size="md">
              {getFileLabel(selectedFile, 0)}
            </TextMedium>
            <TextRegular color={Colors.NEUTRAL_DARK} size="sm">
              Preview not yet available for HMIS files.
            </TextRegular>
            <Pressable
              onPress={() => setSelectedFile(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Closes the file preview"
              style={{
                paddingVertical: Spacings.sm,
                paddingHorizontal: Spacings.md,
                backgroundColor: Colors.PRIMARY_LIGHT,
                borderRadius: Radiuses.xs,
                alignSelf: 'flex-start',
              }}
            >
              <TextRegular color={Colors.WHITE}>Close</TextRegular>
            </Pressable>
          </View>
        </Modal>
      )}
    </Accordion>
  );
}
