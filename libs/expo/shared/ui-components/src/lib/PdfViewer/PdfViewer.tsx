// import PDF from 'react-native-pdf';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

type TProps = {
  url?: string;
  cache?: boolean;
};

export default function PdfViewer(props: TProps) {
  console.log('################################### PdfViewer');
  // const { url, cache = true } = props;
  const { url } = props;

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('################################### loading: ', loading);

  useEffect(() => {
    if (!url) return;

    const downloadPdf = async () => {
      try {
        const fileUri = FileSystem.cacheDirectory + 'temp.pdf';

        const { uri } = await FileSystem.downloadAsync(url, fileUri);

        setFileUri(uri);
      } catch (error) {
        console.error('Error downloading PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    downloadPdf();
  }, [url]);

  if (!fileUri) {
    return null;
  }

  // if (loading) return <ActivityIndicator size="large" color="blue" />;

  return (
    // <></>
    <WebView source={{ uri: fileUri }} style={{ flex: 1 }} />

    // <PDF
    //   source={{
    //     uri: url,
    //     cache,
    //   }}
    //   style={{ flex: 1 }}
    //   onLoadComplete={(numberOfPages, filePath) => {
    //     console.log(`Number of pages: ${numberOfPages}`);
    //   }}
    //   onPageChanged={(page, numberOfPages) => {
    //     console.log('numberOfPages: ', numberOfPages);
    //     console.log(`Current page: ${page}`);
    //   }}
    //   onError={(error) => {
    //     console.log(error);
    //   }}
    //   onPressLink={(uri) => {
    //     console.log(`Link pressed: ${uri}`);
    //   }}
    // />
  );
}
