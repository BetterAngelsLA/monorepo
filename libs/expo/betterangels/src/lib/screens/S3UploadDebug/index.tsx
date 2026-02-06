import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MainScrollContainer } from '../../ui-components';

type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'completing'
  | 'finalized'
  | 'saving'
  | 'done'
  | 'error';

const FIELD_OPTIONS = [
  { label: 'Interior Photo', value: 'shelters.InteriorPhoto.file' },
  { label: 'Exterior Photo', value: 'shelters.ExteriorPhoto.file' },
  { label: 'Video', value: 'shelters.Video.file' },
];

// ---- GraphQL helpers ----

async function gql<T>(
  fetchClient: ReturnType<typeof useApiConfig>['fetchClient'],
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetchClient('/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);

  // strawberry_django mutations return union { Result | OperationInfo }
  const data = json.data as Record<string, unknown>;
  for (const val of Object.values(data)) {
    if (
      val &&
      typeof val === 'object' &&
      'messages' in (val as Record<string, unknown>)
    ) {
      const msgs = (val as { messages: { message: string }[] }).messages;
      if (msgs?.length) throw new Error(msgs[0].message);
    }
  }

  return data as T;
}

const S3_INIT = `
  mutation S3UploadInitialize($data: S3UploadInitInput!) {
    s3UploadInitialize(data: $data) {
      ... on S3UploadInitResult {
        objectKey
        uploadId
        parts { partNumber size uploadUrl }
        uploadSignature
      }
      ... on OperationInfo {
        messages { message kind field }
      }
    }
  }
`;

const S3_COMPLETE = `
  mutation S3UploadComplete($data: S3UploadCompleteInput!) {
    s3UploadComplete(data: $data) {
      ... on S3UploadCompleteResult {
        completeUrl
        body
      }
      ... on OperationInfo {
        messages { message kind field }
      }
    }
  }
`;

const S3_FINALIZE = `
  mutation S3UploadFinalize($data: S3UploadFinalizeInput!) {
    s3UploadFinalize(data: $data) {
      ... on S3UploadFinalizeResult {
        fieldValue
      }
      ... on OperationInfo {
        messages { message kind field }
      }
    }
  }
`;

const S3_ATTACH = `
  mutation CreateS3Attachment($data: CreateS3AttachmentInput!) {
    createS3Attachment(data: $data) {
      ... on S3AttachmentResult {
        id
        modelName
        fileName
        parentId
      }
      ... on OperationInfo {
        messages { message kind field }
      }
    }
  }
`;

export default function S3UploadDebug() {
  const { fetchClient } = useApiConfig();

  // Form state
  const [fieldId, setFieldId] = useState(FIELD_OPTIONS[0].value);
  const [parentId, setParentId] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [fileMime, setFileMime] = useState('application/octet-stream');

  // Upload state
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ------- File picker -------
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
    setFieldValue(null);
    setSaveResult(null);
    setError(null);
    setStatus('idle');
  }, []);

  // ------- S3 Upload (steps 1-4 via GraphQL) -------
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
    setFieldValue(null);
    setSaveResult(null);

    try {
      // 1. Initialize — GraphQL
      const initData = await gql<{
        s3UploadInitialize: {
          objectKey: string;
          uploadId: string;
          parts: { partNumber: number; size: number; uploadUrl: string }[];
          uploadSignature: string;
        };
      }>(fetchClient, S3_INIT, {
        data: {
          fieldId,
          fileName,
          fileSize,
          contentType: fileMime,
        },
      });
      const init = initData.s3UploadInitialize;

      // 2. Read file blob
      const fileBlob = await (await fetch(fileUri)).blob();

      // 3. Upload parts directly to S3
      let uploaded = 0;
      const completedParts: {
        partNumber: number;
        size: number;
        etag: string;
      }[] = [];

      for (const part of init.parts) {
        if (ac.signal.aborted) throw new Error('Upload cancelled');
        const blob = fileBlob.slice(uploaded, uploaded + part.size);
        const partRes = await fetch(part.uploadUrl, {
          method: 'PUT',
          body: blob,
        });
        if (!partRes.ok)
          throw new Error(`Part upload failed: ${partRes.status}`);
        completedParts.push({
          partNumber: part.partNumber,
          size: part.size,
          etag: partRes.headers.get('ETag') ?? '',
        });
        uploaded += part.size;
        setProgress(Math.round((uploaded / fileSize) * 100));
      }

      setProgress(100);
      setStatus('completing');

      // 4a. Complete multipart — GraphQL
      const completeData = await gql<{
        s3UploadComplete: { completeUrl: string; body: string };
      }>(fetchClient, S3_COMPLETE, {
        data: {
          uploadSignature: init.uploadSignature,
          uploadId: init.uploadId,
          parts: completedParts,
        },
      });

      // 4b. Tell S3 to assemble parts
      await fetch(completeData.s3UploadComplete.completeUrl, {
        method: 'POST',
        body: completeData.s3UploadComplete.body,
      });

      // 5. Finalize — GraphQL → signed field_value
      const finalizeData = await gql<{
        s3UploadFinalize: { fieldValue: string };
      }>(fetchClient, S3_FINALIZE, {
        data: { uploadSignature: init.uploadSignature },
      });

      setFieldValue(finalizeData.s3UploadFinalize.fieldValue);
      setStatus('finalized');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  }, [fetchClient, fieldId, fileName, fileUri, fileSize, fileMime]);

  // ------- Save attachment (GraphQL mutation) -------
  const saveAttachment = useCallback(async () => {
    if (!fieldValue || !parentId) return;
    setStatus('saving');
    setError(null);
    setSaveResult(null);

    try {
      const data = await gql<{
        createS3Attachment: {
          id: string;
          modelName: string;
          fileName: string;
          parentId: string;
        };
      }>(fetchClient, S3_ATTACH, {
        data: {
          fieldId,
          fieldValue,
          parentId,
        },
      });

      setSaveResult(JSON.stringify(data.createS3Attachment, null, 2));
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setStatus('error');
    }
  }, [fetchClient, fieldId, fieldValue, parentId]);

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
          : status === 'finalized'
            ? 'Uploaded — ready to save'
            : status === 'saving'
              ? 'Saving to shelter…'
              : status === 'done'
                ? 'Saved!'
                : 'Error';

  const statusColor =
    status === 'done'
      ? Colors.SUCCESS_DARK
      : status === 'error'
        ? Colors.ERROR_DARK
        : status === 'uploading' ||
            status === 'completing' ||
            status === 'saving'
          ? Colors.PRIMARY_DARK
          : status === 'finalized'
            ? Colors.WARNING_DARK
            : Colors.NEUTRAL_DARK;

  const isUploading = status === 'uploading' || status === 'completing';

  if (!__DEV__) return null;

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} keyboardAware>
      <View style={styles.content}>
        {/* Banner */}
        <View style={styles.banner}>
          <TextMedium>Direct-to-S3 Upload (dev)</TextMedium>
          <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
            Full workflow: upload a file to S3, then attach it to a shelter.
          </TextRegular>
        </View>

        {/* Parent ID */}
        <View style={styles.card}>
          <TextMedium size="sm">Parent ID (e.g. Shelter ID)</TextMedium>
          <BasicInput
            label="Parent ID"
            value={parentId}
            onChangeText={setParentId}
            placeholder="e.g. 1"
            keyboardType="number-pad"
          />
        </View>

        {/* Field Selector */}
        <View style={styles.card}>
          <TextMedium size="sm">Attachment Type</TextMedium>
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

        {/* Upload + Progress */}
        <View style={styles.card}>
          <TextMedium size="sm" color={statusColor}>
            {statusLabel}
          </TextMedium>

          {isUploading && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}

          {/* Step 1: Upload to S3 */}
          {(status === 'idle' || status === 'error') && (
            <Button
              title="Upload to S3"
              onPress={upload}
              variant="primary"
              size="full"
              disabled={!fileUri}
              accessibilityHint="Upload the selected file to S3"
            />
          )}

          {/* Cancel */}
          {isUploading && (
            <Button
              title="Cancel"
              onPress={cancel}
              variant="negative"
              size="full"
              accessibilityHint="Cancel the upload"
            />
          )}

          {/* Step 2: Save Attachment */}
          {status === 'finalized' && (
            <Button
              title="Save Attachment"
              onPress={saveAttachment}
              variant="primary"
              size="full"
              disabled={!parentId}
              accessibilityHint="Attach the uploaded file to the parent record"
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

        {/* Save Result */}
        {status === 'done' && saveResult && (
          <View style={[styles.card, styles.successCard]}>
            <TextMedium size="sm" color={Colors.SUCCESS_DARK}>
              Attachment Created!
            </TextMedium>
            <View style={styles.output}>
              <TextRegular size="xs" style={styles.code} selectable>
                {saveResult}
              </TextRegular>
            </View>
          </View>
        )}

        {/* How it works */}
        <View style={styles.card}>
          <TextMedium size="sm">How it works</TextMedium>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            1. GraphQL s3UploadInitialize → presigned part URLs
          </TextRegular>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            2. PUT each part directly to S3
          </TextRegular>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            3. GraphQL s3UploadComplete → assemble parts via S3
          </TextRegular>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            4. GraphQL s3UploadFinalize → signed field_value token
          </TextRegular>
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            5. GraphQL createS3Attachment → create DB record
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
