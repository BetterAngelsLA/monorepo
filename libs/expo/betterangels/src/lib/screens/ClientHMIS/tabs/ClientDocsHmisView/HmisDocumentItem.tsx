import type { ClientFile, FileName } from '@monorepo/expo/shared/clients';
import { Radiuses } from '@monorepo/expo/shared/static';
import { FileCard } from '@monorepo/expo/shared/ui-components';
import mime from 'mime';
import { memo, useMemo } from 'react';
import { FileThumbnail } from '../../../../ui-components';

const toDataUri = (raw: string | undefined, mimeType: string) => {
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  return `data:${mimeType};base64,${raw.trim().replace(/\s/g, '')}`;
};

function useClientFileMetadata(
  file: ClientFile,
  fileNameMap: Record<string, FileName>
) {
  return useMemo(() => {
    const label =
      file.name ||
      (file.ref_file_name
        ? fileNameMap[file.ref_file_name]?.name
        : undefined) ||
      file.file?.filename ||
      `Document ${file.id}`;

    const filenameForMime = file.file?.filename ?? label;
    const detectedMime =
      mime.getType(filenameForMime) ?? 'application/octet-stream';
    const imgMime = detectedMime.startsWith('image')
      ? detectedMime
      : 'image/jpeg';

    const rawThumb =
      file.file?.encodedThumbnailFileContent ??
      file.file?.encodedPreviewFileContent;
    const rawPreview =
      file.file?.encodedPreviewFileContent ??
      file.file?.encodedThumbnailFileContent;

    const thumbnailUri = toDataUri(rawThumb, imgMime);
    const previewUri = toDataUri(rawPreview, imgMime);
    const effectiveMime = previewUri ? imgMime : detectedMime;

    return {
      label,
      thumbnailUri,
      previewUri,
      effectiveMime,
      imgMime,
      detectedMime,
      createdAt: file.file?.added_date ?? '',
    };
  }, [file, fileNameMap]);
}

interface HmisDocumentItemProps {
  file: ClientFile;
  fileNameMap: Record<string, FileName>;
  onPress: (
    id: number,
    preview: { uri: string; mimeType: string },
    params: { label: string; createdAt: string }
  ) => void;
}

export const HmisDocumentItem = memo(
  ({ file, fileNameMap, onPress }: HmisDocumentItemProps) => {
    const {
      label,
      createdAt,
      thumbnailUri,
      previewUri,
      effectiveMime,
      imgMime,
      detectedMime,
    } = useClientFileMetadata(file, fileNameMap);

    return (
      <FileCard
        filename={label}
        url={thumbnailUri}
        onPress={() =>
          onPress(
            file.id,
            { uri: previewUri, mimeType: effectiveMime },
            { label, createdAt }
          )
        }
        createdAt={createdAt}
        thumbnail={
          <FileThumbnail
            uri={thumbnailUri}
            mimeType={thumbnailUri ? imgMime : detectedMime}
            borderRadius={Radiuses.xxxs}
            thumbnailSize={{ width: 36, height: 36 }}
          />
        }
      />
    );
  }
);
