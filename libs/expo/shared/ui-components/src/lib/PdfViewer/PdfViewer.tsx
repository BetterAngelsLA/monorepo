import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, View } from 'react-native';
import PDF from 'react-native-pdf';

type TProps = {
  url?: string;
  cache?: boolean;
};

export default function PdfViewer({ url, cache = true }: TProps) {
  const [localPdfUri, setLocalPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function downloadAndSetPdf() {
      if (!url) return;

      try {
        if (url.startsWith('file://')) {
          setLocalPdfUri(url);
          setLoading(false);
          return;
        }

        const fileUri = `${FileSystem.documentDirectory}temp.pdf`;
        console.log(`Downloading PDF from ${url}...`);

        const { uri } = await FileSystem.downloadAsync(url, fileUri);
        console.log(`PDF saved to: ${uri}`);

        setLocalPdfUri(uri);
      } catch (error) {
        console.error('Failed to download PDF:', error);
      } finally {
        setLoading(false);
      }
    }

    downloadAndSetPdf();
  }, [url]);

  if (!url) return null;

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <PDF
        source={{ uri: localPdfUri || url, cache }}
        style={{ flex: 1, width: Dimensions.get('window').width }}
        onLoadComplete={(numberOfPages, filePath) => {
          console.log(`Number of pages: ${numberOfPages}`);
        }}
        onPageChanged={(page, numberOfPages) => {
          console.log('numberOfPages: ', numberOfPages);
          console.log(`Current page: ${page}`);
        }}
        onError={(error) => {
          console.error('PDF Load Error:', error);
        }}
        onPressLink={(uri) => {
          console.log(`Link pressed: ${uri}`);
        }}
      />
    </View>
  );
}
