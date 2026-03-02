import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useMemo } from 'react';
import { ALLOWED_UPLOAD_TYPES, TMediaPickerMimeType } from './constants';

type DocumentPickerResult =
  | { type: 'success'; files: ReactNativeFile[] }
  | { type: 'cancel' }
  | { type: 'error'; error: unknown };

type UseDocumentPickerParams = {
  allowMultiple?: boolean;
  mimeTypes?: TMediaPickerMimeType[];
};

export function useDocumentPicker(params: UseDocumentPickerParams) {
  const { allowMultiple = false, mimeTypes } = params;

  const pickerMimeTypes = useMemo<string[]>(() => {
    return mimeTypes ? [...mimeTypes] : [...ALLOWED_UPLOAD_TYPES];
  }, [mimeTypes]);

  const pickDocuments = useCallback(async (): Promise<DocumentPickerResult> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: pickerMimeTypes,
        multiple: allowMultiple,
      });

      if (result.canceled || !result.assets?.length) {
        return { type: 'cancel' };
      }

      const uploadedFiles = result.assets.map((asset) => {
        return new ReactNativeFile({
          uri: asset.uri,
          name: asset.name || Date.now().toString(),
          type: asset.mimeType || 'application/octet-stream',
        });
      });

      return {
        type: 'success',
        files: uploadedFiles,
      };
    } catch (error) {
      console.error('useDocumentPicker Error:', error);

      return {
        type: 'error',
        error,
      };
    }
  }, [allowMultiple, pickerMimeTypes]);

  return { pickDocuments };
}
