import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  getHmisAuthHeaders,
  HMIS_API_URL_STORAGE_KEY,
} from '../common/interceptors';

/**
 * Hook to get the necessary headers and base URL for authenticated HMIS file requests (images/downloads)
 */
export function useHmisFileHeaders() {
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const url = await AsyncStorage.getItem(HMIS_API_URL_STORAGE_KEY);
        if (!url || !mounted) return;

        setBaseUrl(url);
        const authHeaders = await getHmisAuthHeaders();
        if (mounted) {
          setHeaders(authHeaders);
        }
      } catch (error) {
        console.error('Failed to load HMIS headers', error);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { headers, baseUrl };
}
