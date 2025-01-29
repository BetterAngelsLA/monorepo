import { PortableText } from '@portabletext/react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { TResource } from '../../clients/sanityCms/types';
import { ResourceLink } from './ResourceLink';
import { ResourceTipsDescription } from './ResourceTipsDescription';

type IProps = {
  resource: TResource;
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    pageBreakBefore: 'always',
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export const ResourceCard = (props: IProps) => {
  const { resource } = props;

  const { title, shortDescription, tipsDescription, resourceLink } = resource;

  return (
    <View wrap={false} style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {!!shortDescription && (
        <View style={{ marginTop: 32 }}>
          <PortableText value={shortDescription} />
        </View>
      )}
      {!!tipsDescription && (
        <ResourceTipsDescription type="alert" data={tipsDescription} />
      )}

      {!!resourceLink && <ResourceLink title={title} href={resourceLink} />}
    </View>
  );
};
