import { Colors } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import PDF from 'react-native-pdf';
import Loading from '../Loading';
import TextMedium from '../TextMedium';

import { Directory, File, Paths } from 'expo-file-system';

type TProps = {
  url?: string;
  cache?: boolean;
  onError?: () => void;
};

export default function PdfViewer(props: TProps) {
  const { onError, url, cache } = props;

  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const { width } = useWindowDimensions();

  function onLoadError(err: unknown) {
    setHasError(true);
    console.error('PdfViewer Load Error:', err);
    if (onError) {
      onError();
    }
  }

  useEffect(() => {
    setHasError(false);

    async function downloadAndSetPdf() {
      if (!url) {
        return;
      }

      try {
        if (url.startsWith('file://') || url.startsWith('content://')) {
          setLocalFileUri(url);
          setLoading(false);
          return;
        }

        const destFile = new File(new Directory(Paths.document), 'temp.pdf');
        const downloaded = await File.downloadFileAsync(url, destFile);

        setLocalFileUri(downloaded.uri);
        setHasError(false);
      } catch (error) {
        onLoadError(error);
      } finally {
        setLoading(false);
      }
    }

    downloadAndSetPdf();
  }, [url]);

  if (!url) {
    return null;
  }

  if (hasError) {
    return <ErrorScreen />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <PDF
        source={{
          uri: localFileUri || url,
          cache,
        }}
        style={{
          flex: 1,
          width: width,
        }}
        onError={onLoadError}
      />
    </View>
  );
}

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Loading size="large" color={Colors.NEUTRAL_DARK} />
    </View>
  );
}

function ErrorScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextMedium
        style={{
          width: '80%',
        }}
        textAlign="center"
      >
        Sorry, there was a problem loading the PDF file.
      </TextMedium>
    </View>
  );
}
