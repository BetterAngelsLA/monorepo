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
    padding: 24,
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
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {!!shortDescription && (
        <View style={{ marginTop: 32 }}>
          <PortableText value={shortDescription} />
        </View>
      )}
      {!!tipsDescription && <ResourceTipsDescription data={tipsDescription} />}

      {!!resourceLink && <ResourceLink title={title} href={resourceLink} />}
    </View>
  );
};
