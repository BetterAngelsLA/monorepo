import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MainScrollContainer } from '../../ui-components';

type UploadStatus = 'idle' | 'uploading' | 'completing' | 'done' | 'error';

const S3_UPLOAD_PATH = '/api/s3-upload';

const FIELD_OPTIONS = [
  { label: 'Interior Photo', value: 'shelters.InteriorPhoto.file' },
  { label: 'Exterior Photo', value: 'shelters.ExteriorPhoto.file' },
  { label: 'Video', value: 'shelters.Video.file' },
];

interface UploadPart {
  part_number: number;
  size: number;
  upload_url: string;
}

interface InitResponse {
  object_key: string;
  upload_id: string;
  parts: UploadPart[];
  upload_signature: string;
}

export default function S3UploadDebug() {
  const { fetchClient } = useApiConfig();
  const [fieldId, setFieldId] = useState(FIELD_OPTIONS[0].value);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [fileMime, setFileMime] = useState('application/octet-stream');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const pickFile = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets?.length) return;

    const asset = res.assets[0];
    setFileName(asset.name);
    setFileUri(asset.uri);
    setFileSize(asset.size ?? 0);
    setFileMime(asset.mimeType ?? 'application/octet-stream');
    setResult(null);
    setError(null);
    setStatus('idle');
  }, []);

  const upload = useCallback(async () => {
    if (!fileUri || !fileSize) {
      setError('Pick a file first');
      return;
    }

    const ac = new AbortController();
    abortRef.current = ac;
    setProgress(0);
    setStatus('uploading');
    setError(null);
    setResult(null);

    try {
      // 1. Initialize multipart upload
      const initRes = await fetchClient(
        `${S3_UPLOAD_PATH}/upload-initialize/`,
        {
          method: 'POST',
          body: JSON.stringify({
            field_id: fieldId,
            file_name: fileName,
            file_size: fileSize,
            content_type: fileMime,
          }),
        }
      );

      if (!initRes.ok) {
        throw new Error(`Initialize failed: ${initRes.status}`);
      }

      const init: InitResponse = await initRes.json();

      // 2. Fetch the file blob from the local URI
      const fileResponse = await fetch(fileUri);
      const fileBlob = await fileResponse.blob();

      // 3. Upload each part directly to S3
      let uploaded = 0;
      const completedParts: {
        part_number: number;
        size: number;
        etag: string;
      }[] = [];

      for (const part of init.parts) {
        if (ac.signal.aborted) throw new Error('Upload cancelled');

        const blob = fileBlob.slice(uploaded, uploaded + part.size);

        const partRes = await fetch(part.upload_url, {
          method: 'PUT',
          body: blob,
        });

        if (!partRes.ok) {
          throw new Error(`Part upload failed: ${partRes.status}`);
        }

        const etag = partRes.headers.get('ETag') ?? '';
        completedParts.push({
          part_number: part.part_number,
          size: part.size,
          etag,
        });

        uploaded += part.size;
        setProgress(Math.round((uploaded / fileSize) * 100));
      }

      setProgress(100);
      setStatus('completing');

      // 4. Complete multipart upload
      const completeRes = await fetchClient(
        `${S3_UPLOAD_PATH}/upload-complete/`,
        {
          method: 'POST',
          body: JSON.stringify({
            upload_signature: init.upload_signature,
            upload_id: init.upload_id,
            parts: completedParts,
          }),
        }
      );

      if (!completeRes.ok) {
        throw new Error(`Complete failed: ${completeRes.status}`);
      }

      const completeData: { complete_url: string; body: string } =
        await completeRes.json();

      // 5. Call the S3 complete URL
      await fetch(completeData.complete_url, {
        method: 'POST',
        body: completeData.body,
      });

      // 6. Finalize to get the signed field_value
      const finalizeRes = await fetchClient(`${S3_UPLOAD_PATH}/finalize/`, {
        method: 'POST',
        body: JSON.stringify({
          upload_signature: init.upload_signature,
        }),
      });

      if (!finalizeRes.ok) {
        throw new Error(`Finalize failed: ${finalizeRes.status}`);
      }

      const finalizeData: { field_value: string } = await finalizeRes.json();
      setResult(finalizeData.field_value);
      setStatus('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  }, [fetchClient, fieldId, fileName, fileUri, fileSize, fileMime]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
  }, []);

  const statusLabel =
    status === 'idle'
      ? 'Ready'
      : status === 'uploading'
      ? `Uploading ${progress}%`
      : status === 'completing'
      ? 'Completing…'
      : status === 'done'
      ? 'Done'
      : 'Error';

  const statusColor =
    status === 'done'
      ? Colors.SUCCESS_DARK
      : status === 'error'
      ? Colors.ERROR_DARK
      : status === 'uploading' || status === 'completing'
      ? Colors.PRIMARY_DARK
      : Colors.NEUTRAL_DARK;

  if (!__DEV__) return null;

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} keyboardAware>
      <View style={styles.content}>
        {/* Banner */}
        <View style={styles.banner}>
          <TextMedium>Direct-to-S3 Upload (dev)</TextMedium>
          <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
            Uploads a file directly to S3/MinIO via the REST API at
            /api/s3-upload/. No custom GraphQL mutation needed. The resulting
            signed field_value can be used in any mutation that accepts a file.
          </TextRegular>
        </View>

        {/* Field Selector */}
        <View style={styles.card}>
          <TextMedium size="sm">Target Field</TextMedium>
          <View style={styles.fieldList}>
            {FIELD_OPTIONS.map((opt) => (
              <FieldButton
                key={opt.value}
                label={opt.label}
                isActive={fieldId === opt.value}
                onPress={() => setFieldId(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* File Picker */}
        <View style={styles.card}>
          <TextMedium size="sm">File</TextMedium>
          <Button
            title="Pick a file…"
            onPress={pickFile}
            variant="secondary"
            size="full"
            accessibilityHint="Open file picker"
          />
          {fileName && (
            <View style={styles.fileInfo}>
              <TextRegular
                size="sm"
                color={Colors.NEUTRAL_DARK}
                numberOfLines={2}
              >
                {fileName}
              </TextRegular>
              <TextRegular
                size="xs"
                color={Colors.NEUTRAL_DARK}
                numberOfLines={1}
              >
                {(fileSize / 1024).toFixed(1)} KB · {fileMime}
              </TextRegular>
            </View>
          )}
        </View>

        {/* Upload Controls */}
        <View style={styles.card}>
          <TextMedium size="sm">Status</TextMedium>
          <TextMedium size="sm" color={statusColor} numberOfLines={1}>
            {statusLabel}
          </TextMedium>

          {/* Progress bar */}
          {(status === 'uploading' || status === 'completing') && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}

          <Button
            title="Upload to S3"
            onPress={upload}
            variant="primary"
            size="full"
            disabled={
              !fileUri || status === 'uploading' || status === 'completing'
            }
            accessibilityHint="Start uploading the selected file to S3"
          />
          {(status === 'uploading' || status === 'completing') && (
            <Button
              title="Cancel"
              onPress={cancel}
              variant="negative"
              size="full"
              accessibilityHint="Cancel the in-progress upload"
            />
          )}
        </View>

        {/* Error */}
        {status === 'error' && error && (
          <View style={[styles.card, styles.errorCard]}>
            <TextMedium size="sm" color={Colors.ERROR_DARK}>
              Error
            </TextMedium>
            <TextRegular size="sm" color={Colors.ERROR_DARK}>
              {error}
            </TextRegular>
          </View>
        )}

        {/* Result */}
        {status === 'done' && result && (
          <View style={[styles.card, styles.successCard]}>
            <TextMedium size="sm" color={Colors.SUCCESS_DARK}>
              Upload complete!
            </TextMedium>
            <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
              Signed field_value (use in GraphQL mutations):
            </TextRegular>
            <View style={styles.output}>
              <TextRegular size="xs" style={styles.code} selectable>
                {result}
              </TextRegular>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.card}>
          <TextMedium size="sm">How it works</TextMedium>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            1. Initialize — POST to /api/s3-upload/upload-initialize/ with
            field_id and file metadata
          </TextRegular>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            2. Upload parts — PUT each part directly to the presigned S3 URL
          </TextRegular>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            3. Complete — POST to /api/s3-upload/upload-complete/, then POST to
            S3 complete URL
          </TextRegular>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            4. Finalize — POST to /api/s3-upload/finalize/ → returns signed
            field_value
          </TextRegular>
        </View>
      </View>
    </MainScrollContainer>
  );
}

function FieldButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.fieldButton, isActive && styles.fieldButtonActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={`${label} field`}
      accessibilityHint={`Select ${label} as the target field`}
      accessibilityState={{ selected: isActive }}
    >
      <TextMedium
        size="sm"
        color={isActive ? Colors.PRIMARY_EXTRA_DARK : Colors.NEUTRAL_DARK}
      >
        {label}
      </TextMedium>
      {isActive && (
        <TextRegular size="xs" color={Colors.PRIMARY_DARK}>
          ✓
        </TextRegular>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: Spacings.sm,
  },
  banner: {
    backgroundColor: Colors.WARNING_EXTRA_LIGHT,
    borderColor: Colors.WARNING_LIGHT,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    gap: Spacings.xs,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    gap: Spacings.xs,
  },
  errorCard: {
    borderColor: Colors.ERROR_LIGHT,
    backgroundColor: Colors.ERROR_EXTRA_LIGHT,
  },
  successCard: {
    borderColor: Colors.SUCCESS_LIGHT,
    backgroundColor: Colors.SUCCESS_EXTRA_LIGHT,
  },
  row: {
    flexDirection: 'row',
    gap: Spacings.xs,
    alignItems: 'center',
  },
  fieldList: {
    flexDirection: 'column',
    gap: Spacings.xs,
  },
  fileInfo: {
    gap: 2,
  },
  fieldButton: {
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderRadius: Radiuses.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldButtonActive: {
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    borderColor: Colors.PRIMARY,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  output: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    overflow: 'hidden',
  },
  code: {
    lineHeight: 18,
    flexShrink: 1,
  },
});
