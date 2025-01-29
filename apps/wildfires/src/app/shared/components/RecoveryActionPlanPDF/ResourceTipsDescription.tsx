import { PortableText } from '@portabletext/react';
import { PortableTextBlock } from '@portabletext/types';
import { Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export const ResourceTipsDescription = ({
  type,
  data,
}: {
  type?: 'alert';
  data: PortableTextBlock;
}) => {
  return (
    <View
      style={{
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: type === 'alert' ? '#f4f6fd' : 'white',
      }}
    >
      <View style={styles.header}>
        <Svg viewBox="0 0 24 24" width="24" height="24">
          <Path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M6.09 14.999a6.9 6.9 0 0 1-.59-2.794C5.5 8.5 8.41 5.499 12 5.499s6.5 3.002 6.5 6.706a6.9 6.9 0 0 1-.59 2.794m-5.91-13v1m10 9h-1m-18 0H2m17.07-7.071l-.707.707m-12.726.001l-.707-.707m9.587 14.377c1.01-.327 1.416-1.252 1.53-2.182c.034-.278-.195-.509-.475-.509H8.477a.483.483 0 0 0-.488.534c.112.928.394 1.606 1.464 2.156m5.064 0H9.453m5.064 0c-.121 1.945-.683 2.716-2.51 2.694c-1.954.036-2.404-.916-2.554-2.693"
            color="currentColor"
          />
        </Svg>

        <Text style={styles.title}>Useful Tips</Text>
      </View>
      <View style={{ marginTop: 16 }}>
        <PortableText value={data} />
      </View>
    </View>
  );
};
