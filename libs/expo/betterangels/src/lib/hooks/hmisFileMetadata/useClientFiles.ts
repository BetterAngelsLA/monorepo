import type { ClientFile } from '@monorepo/expo/shared/clients';
import { useEffect, useState } from 'react';
import { useHmisClient } from '../useHmisClient';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useClientFiles(clientId?: string, hmisId?: string) {
  const { getClientFiles } = useHmisClient();
  const [status, setStatus] = useState<Status>('idle');
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !hmisId) {
      setFiles([]);
      setStatus('idle');
      setError(null);
      return;
    }

    let isActive = true;
    setStatus('loading');
    setError(null);

    getClientFiles(hmisId, {
      fields:
        'id,ref_category,ref_file_name,ref_agency,name,is_program_file,file.*,category,fileName',
    })
      .then((data) => {
        if (!isActive) return;
        setFiles(data.items ?? []);
        setStatus('success');
      })
      .catch((err) => {
        if (!isActive) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load documents.';
        setError(message);
        setStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [clientId, hmisId, getClientFiles]);

  return {
    files,
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
  };
}
