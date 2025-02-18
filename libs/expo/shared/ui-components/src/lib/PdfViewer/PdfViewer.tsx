import PDF from 'react-native-pdf';

type TProps = {
  url?: string;
  cache?: boolean;
};

export default function PdfViewer(props: TProps) {
  const { url, cache = true } = props;

  if (!url) {
    return null;
  }

  return (
    <PDF
      source={{
        uri: url,
        cache,
      }}
      style={{ flex: 1 }}
    />
  );
}
