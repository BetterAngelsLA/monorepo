import { Colors } from '@monorepo/expo/shared/static';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';
import PDF from 'react-native-pdf';
import Loading from '../Loading';
import TextMedium from '../TextMedium';

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

  function onLoadError(err: any) {
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
        if (url.startsWith('file://')) {
          setLocalFileUri(url);
          setLoading(false);

          return;
        }

        const localDestinationUri = `${FileSystem.documentDirectory}temp.pdf`;

        const { uri } = await FileSystem.downloadAsync(
          url,
          localDestinationUri
        );

        setLocalFileUri(uri);
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
          width: Dimensions.get('window').width,
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
