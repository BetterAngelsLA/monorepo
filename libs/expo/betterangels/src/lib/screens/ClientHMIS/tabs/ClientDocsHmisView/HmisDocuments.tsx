import type { ClientFile, FileName } from '@monorepo/expo/shared/clients';
import { FolderIcon, FolderOpenIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, FileCard } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import mime from 'mime';
import { useCallback } from 'react';
import { View } from 'react-native';
import { FileThumbnail } from '../../../../ui-components';
import { setHmisFilePreview } from '../../../HmisFileInfo/hmisFilePreviewCache';

function getMimeTypeFromFilename(filename: string): string {
  return mime.getType(filename) ?? 'application/octet-stream';
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

function toDataUri(raw: string, mimeType: string): string {
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  const encoded = raw.trim().replace(/\s/g, '');
  return `data:${mimeType};base64,${encoded}`;
}

/** Thumbnail for list/card (prefers smaller thumbnail, then preview). */
function getFileThumbnail(file: ClientFile, mimeType: string): string {
  const raw =
    file.file?.encodedThumbnailFileContent ??
    file.file?.encodedPreviewFileContent ??
    '';
  return toDataUri(raw, mimeType);
}

/** Preview for file info screen (prefers larger preview, then thumbnail). */
function getFilePreview(file: ClientFile, mimeType: string): string {
  const raw =
    file.file?.encodedPreviewFileContent ??
    file.file?.encodedThumbnailFileContent ??
    '';
  return toDataUri(raw, mimeType);
}

type FileDisplayData = {
  label: string;
  createdAt: string;
  thumbnailUri: string;
  previewUri: string;
  mimeType: string;
  thumbnailMimeType: string;
};

function buildFileDisplayData(
  file: ClientFile,
  fileNames: FileName[]
): FileDisplayData {
  const label = getFileLabel(file, fileNames);
  const filenameForMime = file.file?.filename ?? label;
  const mimeType = getMimeTypeFromFilename(filenameForMime);

  const thumbnailMimeType = mimeType.startsWith('image')
    ? mimeType
    : 'image/jpeg';

  const thumbnailUri = getFileThumbnail(file, thumbnailMimeType);
  const previewUri = getFilePreview(file, thumbnailMimeType);

  const createdAt = file.file?.added_date ?? '';
  const effectiveMimeType = previewUri ? thumbnailMimeType : mimeType;

  return {
    label,
    createdAt,
    thumbnailUri,
    previewUri,
    mimeType: effectiveMimeType,
    thumbnailMimeType,
  };
}

type FilePressPayload = {
  label: string;
  createdAt: string;
  uri: string;
  mimeType: string;
};

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
    (
      file: ClientFile,
      { label, createdAt, uri, mimeType }: FilePressPayload
    ) => {
      setHmisFilePreview(String(file.id), { uri, mimeType });
      router.navigate({
        pathname: `/hmis-file/${file.id}`,
        params: { label, createdAt },
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
            const {
              label,
              createdAt,
              thumbnailUri,
              previewUri,
              mimeType,
              thumbnailMimeType,
            } = buildFileDisplayData(file, fileNames);

            return (
              <FileCard
                key={String(file?.id ?? idx)}
                filename={label}
                url={thumbnailUri || ''}
                onPress={() =>
                  handleFilePress(file, {
                    label,
                    createdAt,
                    uri: previewUri,
                    mimeType,
                  })
                }
                createdAt={createdAt}
                thumbnail={
                  <FileThumbnail
                    uri={thumbnailUri}
                    mimeType={thumbnailUri ? thumbnailMimeType : mimeType}
                    borderRadius={Radiuses.xxxs}
                    thumbnailSize={{ width: 36, height: 36 }}
                  />
                }
              />
            );
          })}
        </View>
      )}
    </Accordion>
  );
}
