import { Colors } from '@monorepo/expo/shared/static';
import React, { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import PDF from 'react-native-pdf';
import Loading from '../Loading';
import TextMedium from '../TextMedium';

import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

type TProps = {
  url?: string;
  /** If true, persist a copy under cacheDirectory keyed by URL. Defaults to true. */
  cache?: boolean;
  onError?: () => void;
  headers?: Record<string, string>;
};

export default function PdfViewer({
  url,
  cache = true,
  onError,
  headers,
}: TProps) {
  const { width } = useWindowDimensions();

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [hasError, setHasError] = useState<boolean>(false);

  // track in-flight work to prevent races
  const opKeyRef = useRef<string | null>(null);
  const tempFileRef = useRef<File | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      // cleanup temp file when not caching
      try {
        tempFileRef.current?.delete();
      } catch {}
      tempFileRef.current = null;
    };
  }, []);

  function finishWith(uri: string | null) {
    if (unmountedRef.current) return;
    setLocalUri(uri);
    setLoading(false);
  }

  function fail(err: unknown) {
    console.error('PdfViewer Load Error:', err);
    if (unmountedRef.current) return;
    setHasError(true);
    setLoading(false);
    onError?.();
  }

  useEffect(() => {
    // reset state on url change
    setHasError(false);
    setLocalUri(null);

    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // direct URIs need no download
    if (url.startsWith('file://') || url.startsWith('content://')) {
      finishWith(url);
      return;
    }

    // each URL+cache pair is a distinct op; ignore stale completions
    const key = `${url}::${cache ? 'cache' : 'temp'}`;
    opKeyRef.current = key;

    const run = async () => {
      try {
        if (cache) {
          // create cache dir
          const cacheDir = new Directory(Paths.cache, 'pdf-cache');
          cacheDir.create({ idempotent: true, intermediates: true });

          // stable file name based on URL hash
          const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            url
          );
          const ext = inferPdfExt(url); // keeps ".pdf" if present, else ".pdf"
          const finalFile = new File(cacheDir, `${hash}${ext}`);

          // use if already present and non-empty
          if (finalFile.exists && (finalFile.size ?? 0) > 0) {
            if (opKeyRef.current === key) finishWith(finalFile.uri);
            return;
          }

          // download directly to final path; overwrite if exists
          const downloaded = await File.downloadFileAsync(url, finalFile, {
            headers,
            idempotent: true,
          });

          // sanity check: ensure non-empty
          if ((downloaded.size ?? 0) <= 0)
            throw new Error('Downloaded empty PDF');

          if (opKeyRef.current === key) finishWith(downloaded.uri);
          return;
        } else {
          // non-persistent: unique temp file, cleaned up on unmount/url change
          const tempDir = new Directory(Paths.cache, 'pdf-temp');
          tempDir.create({ idempotent: true, intermediates: true });

          const name = `pdf-${Date.now()}-${Math.floor(
            Math.random() * 1e6
          )}.pdf`;
          const tmp = new File(tempDir, name);
          tempFileRef.current = tmp;

          const downloaded = await File.downloadFileAsync(url, tmp, {
            headers,
            idempotent: true, // enables overwrite if a rare name collision happens
          });

          if ((downloaded.size ?? 0) <= 0)
            throw new Error('Downloaded empty PDF');

          if (opKeyRef.current === key) finishWith(downloaded.uri);
          return;
        }
      } catch (err) {
        if (opKeyRef.current === key) fail(err);
      }
    };

    run();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, cache]);

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

  if (loading) {
    return (
      <Centered>
        <Loading size="large" color={Colors.NEUTRAL_DARK} />
      </Centered>
    );
  }

  // Always provide a local file when possible; react-native-pdf's internal cache is unnecessary.
  return (
    <View style={{ flex: 1 }}>
      <PDF
        source={{
          uri: localUri || url, // local file when cached/temp, else remote fallback
          cache: false, // we control caching; avoid double caching
          headers, // passed if remote or some readers still use it
        }}
        style={{ flex: 1, width }}
        onError={fail}
      />
    </View>
  );
}

function inferPdfExt(input: string): string {
  // keep ".pdf" if URL path ends with it (ignoring query/hash)
  try {
    const u = new URL(input);
    const cleanPath = u.pathname.toLowerCase();
    return cleanPath.endsWith('.pdf') ? '.pdf' : '.pdf';
  } catch {
    return input.toLowerCase().includes('.pdf') ? '.pdf' : '.pdf';
  }
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
