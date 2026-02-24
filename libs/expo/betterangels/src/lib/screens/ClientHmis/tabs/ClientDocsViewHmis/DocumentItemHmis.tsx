import {
  getFileUrlsHmis,
  type ClientFile,
  type FileName,
} from '@monorepo/expo/shared/clients';
import { Radiuses } from '@monorepo/expo/shared/static';
import { FileCard } from '@monorepo/expo/shared/ui-components';
import mime from 'mime';
import { memo, useMemo } from 'react';
import { FileThumbnail } from '../../../../ui-components';

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

    return {
      label,
      detectedMime,
      createdAt: file.file?.added_date ?? '',
    };
  }, [file, fileNameMap]);
}

interface DocumentItemHmisProps {
  file: ClientFile;
  fileNameMap: Record<string, FileName>;
  baseUrl: string | null;
  headers: Record<string, string> | null;
  onPress: (id: number, params: { label: string; createdAt: string }) => void;
  clientId?: string;
}

export const DocumentItemHmis = memo(
  ({
    file,
    fileNameMap,
    onPress,
    baseUrl,
    headers,
    clientId,
  }: DocumentItemHmisProps) => {
    const { label, createdAt, detectedMime } = useClientFileMetadata(
      file,
      fileNameMap
    );

    const thumbnailUri =
      baseUrl && headers && clientId
        ? getFileUrlsHmis(baseUrl, clientId, file.id).thumbnail
        : '';

    return (
      <FileCard
        filename={label}
        url={thumbnailUri}
        onPress={() => onPress(file.id, { label, createdAt })}
        createdAt={createdAt}
        thumbnail={
          <FileThumbnail
            uri={thumbnailUri}
            headers={headers ?? undefined}
            mimeType={detectedMime}
            borderRadius={Radiuses.xxxs}
            thumbnailSize={{ width: 36, height: 36 }}
          />
        }
      />
    );
  }
);
