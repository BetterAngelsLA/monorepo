import { Colors } from '@monorepo/expo/shared/static';
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Loading from '../Loading';
import TextMedium from '../TextMedium';
import { TPdfViewerProps } from './types';

/**
 * Web build of {@link PdfViewer}.
 *
 * `react-native-pdf` is a native view (its module imports
 * `codegenNativeComponent`, which Expo's web resolver rejects outright), and the
 * native component also caches to disk through `expo-file-system`, whose web
 * build only warns "not supported on web".
 *
 * Two paths, because they have genuinely different constraints:
 *
 * 1. **No `headers`** (the only call site today) — the `<iframe>` points straight
 *    at `url` and the browser fetches it as a *navigation*. A navigation is not
 *    subject to the CORS check, so this renders PDFs from an origin that sends no
 *    `Access-Control-Allow-Origin` — which the previous blob fetch could not do.
 *    That fetch bought nothing here: nothing was being authenticated, and it
 *    turned a working document into "Sorry, there was a problem loading the PDF
 *    file" whenever the media origin didn't opt into CORS.
 *
 * 2. **With `headers`** — the bytes have to be fetched to attach an
 *    `Authorization`-style header, then handed to the browser through a Blob URL.
 *    This path can fail visibly, so it is the one that reports through `onError`.
 *
 * `cache` / `cacheKey` / `maxCacheEntries` are accepted for interface parity and
 * intentionally unused: HTTP caching plus the browser's own PDF handling replace
 * the on-disk cache, and this component does not persist bytes itself.
 */
const frameStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
};

export default function PdfViewer({ url, onError, headers }: TPdfViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const createdUrlRef = useRef<string | null>(null);

  // Only re-run when header *contents* change, not on object identity.
  const headersSig = useMemo(() => JSON.stringify(headers ?? {}), [headers]);

  // A fetch is only needed when there is something to send.
  const needsFetch = headersSig !== '{}';

  // Read through refs so a caller passing an inline object/callback cannot
  // re-trigger the fetch on every render and loop.
  const headersRef = useRef(headers);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    headersRef.current = headers;
    onErrorRef.current = onError;
  }, [headers, onError]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setHasError(false);
    setObjectUrl(null);

    // Nothing to authenticate: the direct <iframe> below needs no fetch.
    if (!url || !needsFetch) return;

    const run = async () => {
      try {
        const response = await fetch(url, {
          headers: headersRef.current,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`PDF request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        if (blob.size <= 0) throw new Error('Downloaded empty PDF');
        if (cancelled) return;

        const nextUrl = URL.createObjectURL(blob);
        createdUrlRef.current = nextUrl;
        setObjectUrl(nextUrl);
      } catch (err) {
        // An abort is our own cleanup on unmount/url change, not a load failure.
        if (cancelled || controller.signal.aborted) return;

        console.error('PdfViewer Load Error:', err);
        setHasError(true);
        onErrorRef.current?.(err);
      }
    };

    void run();

    return () => {
      cancelled = true;
      // Also frees the response body rather than only flagging it — a large PDF
      // would otherwise keep downloading and buffering after the viewer is gone.
      controller.abort();
      // Blob URLs leak until explicitly revoked.
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current);
        createdUrlRef.current = null;
      }
    };
  }, [url, headersSig, needsFetch]);

  if (!url) return null;

  if (!needsFetch) {
    return (
      <View style={styles.container}>
        <iframe title="PDF document" src={url} style={frameStyle} />
      </View>
    );
  }

  if (hasError) {
    return (
      <Centered>
        <TextMedium style={{ width: '80%' }} textAlign="center">
          Sorry, there was a problem loading the PDF file.
        </TextMedium>
      </Centered>
    );
  }

  if (!objectUrl) {
    return (
      <Centered>
        <Loading size="large" color={Colors.NEUTRAL_DARK} />
      </Centered>
    );
  }

  return (
    <View style={styles.container}>
      <iframe title="PDF document" src={objectUrl} style={frameStyle} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
