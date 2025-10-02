import { Colors } from '@monorepo/expo/shared/static';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import PDF from 'react-native-pdf';
import Loading from '../Loading';
import TextMedium from '../TextMedium';

import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { drop, filter, forEach, pipe, sortBy } from 'remeda';

type TProps = {
  url?: string;
  /** Persist a copy under cacheDirectory keyed by URL (or cacheKey). Defaults to true. */
  cache?: boolean;
  /** Override the cache key (useful for signed/expiring URLs). */
  cacheKey?: string;
  onError?: (err?: unknown) => void;
  headers?: Record<string, string>;
  /** Max number of cached PDFs to keep (newest kept). Disabled if undefined. */
  maxCacheEntries?: number;
};

export default function PdfViewer({
  url,
  cache = true,
  cacheKey,
  onError,
  headers,
  maxCacheEntries = 20,
}: TProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  // delete temp file on unmount / url change when cache=false
  const tempFileRef = useRef<File | null>(null);

  // Only re-run when header contents change (not just object identity)
  const headersSig = useMemo(() => JSON.stringify(headers ?? {}), [headers]);

  const isLoading = !!url && !localUri && !hasError;

  useEffect(() => {
    let cancelled = false;

    setHasError(false);
    setLocalUri(null);

    if (!url) return;

    // device/local URIs can be used directly
    if (isDeviceUri(url)) {
      setLocalUri(url);
      return;
    }

    const run = async () => {
      try {
        if (cache) {
          const cacheDir = ensureDir(new Directory(Paths.cache, 'pdf-cache'));

          const key =
            cacheKey ??
            (await Crypto.digestStringAsync(
              Crypto.CryptoDigestAlgorithm.SHA256,
              url
            ));

          const finalFile = new File(cacheDir, `${key}.pdf`);

          // reuse non-empty cached file
          if (finalFile.exists && (finalFile.size ?? 0) > 0) {
            if (!cancelled) setLocalUri(finalFile.uri);
            return;
          }

          // download directly to final path; overwrite if exists
          const downloaded = await File.downloadFileAsync(url, finalFile, {
            headers,
            idempotent: true,
          });

          if ((downloaded.size ?? 0) <= 0)
            throw new Error('Downloaded empty PDF');
          if (!cancelled) setLocalUri(downloaded.uri);

          // trim cache off-thread so we don't block UI
          if (typeof maxCacheEntries === 'number' && maxCacheEntries > 0) {
            setTimeout(() => {
              try {
                enforceCacheLimit(cacheDir, maxCacheEntries);
              } catch (e) {
                // eslint-disable-next-line no-console
                console.debug('PdfViewer cache trim error (ignored):', e);
              }
            }, 0);
          }
        } else {
          // temp (non-persistent) unique file
          const tempDir = ensureDir(new Directory(Paths.cache, 'pdf-temp'));
          const name = `pdf-${Date.now()}-${Math.floor(
            Math.random() * 1e6
          )}.pdf`;
          const tmp = new File(tempDir, name);
          tempFileRef.current = tmp;

          const downloaded = await File.downloadFileAsync(url, tmp, {
            headers,
            idempotent: true, // safe if a rare name collision happens
          });

          if ((downloaded.size ?? 0) <= 0)
            throw new Error('Downloaded empty PDF');
          if (!cancelled) setLocalUri(downloaded.uri);
        }
      } catch (err) {
        // eslint-clean
        // eslint-disable-next-line no-console
        console.error('PdfViewer Load Error:', err);
        if (!cancelled) {
          setHasError(true);
          onError?.(err);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      try {
        tempFileRef.current?.delete();
      } catch (e) {
        // eslint-clean
        // eslint-disable-next-line no-console
        console.debug('PdfViewer temp cleanup error (ignored):', e);
      }
      tempFileRef.current = null;
    };
  }, [url, cache, cacheKey, headersSig, onError, maxCacheEntries, headers]);

  if (!url) return null;

  if (hasError) {
    return (
      <Centered>
        <TextMedium style={{ width: '80%' }} textAlign="center">
          Sorry, there was a problem loading the PDF file.
        </TextMedium>
      </Centered>
    );
  }

  if (isLoading) {
    return (
      <Centered>
        <Loading size="large" color={Colors.NEUTRAL_DARK} />
      </Centered>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PDF
        key={localUri || url} // force clean remount when source path changes
        source={{
          uri: localUri || url, // prefer local path
          cache: false, // avoid RN-PDF internal caching; we manage it
          headers,
        }}
        style={{ flex: 1 }}
        onError={(e) => {
          // eslint-clean
          // eslint-disable-next-line no-console
          console.error('react-native-pdf error:', e);
          setHasError(true);
          onError?.(e);
        }}
      />
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

function isDeviceUri(u: string) {
  return u.startsWith('file://') || u.startsWith('content://');
}

function ensureDir(dir: Directory) {
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Keep the newest `limit` files by modificationTime; delete the rest. */
function enforceCacheLimit(dir: Directory, limit: number) {
  if (!Number.isFinite(limit) || limit <= 0) return;

  const entries = dir.list(); // sync; caller should schedule off-thread if concerned

  pipe(
    entries,
    filter((e): e is File => e instanceof File),
    sortBy([(f) => f.modificationTime ?? 0, 'desc']), // newest first
    drop(limit), // keep N newest, drop the rest
    forEach((f) => {
      try {
        f.delete();
      } catch (e) {
        // eslint-clean
        // eslint-disable-next-line no-console
        console.debug('Cache delete failed (ignored):', f.uri, e);
      }
    })
  );
}
