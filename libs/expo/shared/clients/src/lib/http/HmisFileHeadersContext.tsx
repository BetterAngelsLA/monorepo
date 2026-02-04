import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { loadHmisFileHeaders } from '../common/interceptors';

export interface HmisFileHeadersValue {
  headers: Record<string, string> | null;
  baseUrl: string | null;
}

const HmisFileHeadersContext = createContext<HmisFileHeadersValue | null>(null);

/**
 * Provider that loads HMIS file headers and base URL once and shares them via context.
 * Wrap screens that use useHmisFileHeadersContext / useClientPhotoContentUri so the async
 * work runs once instead of per list item.
 */
export function HmisFileHeadersProvider({ children }: { children: ReactNode }) {
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadHmisFileHeaders().then(({ headers: h, baseUrl: url }) => {
      if (mounted) {
        setHeaders(h);
        setBaseUrl(url);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const value: HmisFileHeadersValue = { headers, baseUrl };

  return (
    <HmisFileHeadersContext.Provider value={value}>
      {children}
    </HmisFileHeadersContext.Provider>
  );
}

export function useHmisFileHeadersContext(): HmisFileHeadersValue | null {
  return useContext(HmisFileHeadersContext);
}
