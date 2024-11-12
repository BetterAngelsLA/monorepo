import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ImagesWithZoom,
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../apollo';
import { enumDisplayDocumentType } from '../../static/enumDisplayMapping';
import { MainContainer } from '../../ui-components';
import { useClientDocumentQuery } from './__generated__/Document.generated';

const ID_STYLE = [
  ClientDocumentNamespaceEnum.PhotoId,
  ClientDocumentNamespaceEnum.DriversLicenseFront,
  ClientDocumentNamespaceEnum.DriversLicenseBack,
  ClientDocumentNamespaceEnum.SocialSecurityCard,
];

export default function FileScreenComponent({ id }: { id: string }) {
  const { data } = useClientDocumentQuery({ variables: { id } });
  const navigation = useNavigation();

  useLayoutEffect(() => {
    if (!data) return;
    navigation.setOptions({
      title: enumDisplayDocumentType[data.clientDocument.namespace],
    });
  }, [data, navigation]);

  const ImageComponent = useMemo(() => {
    if (!data) return null;

    if (ID_STYLE.includes(data.clientDocument.namespace)) {
      return (
        <View
          style={{
            borderWidth: 1,
            borderColor: Colors.NEUTRAL_LIGHT,
            borderRadius: Radiuses.xs,
            marginBottom: Spacings.md,
            padding: Spacings.xxs,
            width: 129,
            height: 86.5,
          }}
        >
          <Image
            style={{
              width: '100%',
              height: '100%',

              borderRadius: Radiuses.xs,
            }}
            source={{ uri: data.clientDocument.file.url }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      );
    } else {
      return (
        <Image
          style={{ width: 207, height: 346, marginBottom: Spacings.md }}
          source={{ uri: data.clientDocument.file.url }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      );
    }
  }, [data]);

  if (!data)
    return (
      <View style={styles.loadingContainer}>
        <Loading size="large" />
      </View>
    );

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TextBold mb="xs" size="lg">
        {enumDisplayDocumentType[data.clientDocument.namespace]}
      </TextBold>
      <View style={styles.fileContainer}>
        <ImagesWithZoom
          title={data.clientDocument.originalFilename}
          imageUrls={[{ url: data.clientDocument.file.url }]}
        >
          {ImageComponent}
        </ImagesWithZoom>
        <TextBold size="sm">File Name</TextBold>
        <TextRegular size="sm">
          {data.clientDocument.originalFilename}
        </TextRegular>
      </View>
      <TextRegular textAlign="right" size="sm">
        Uploaded on {format(data.clientDocument.createdAt, 'MM/dd/yyyy')}
      </TextRegular>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  fileContainer: {
    backgroundColor: Colors.WHITE,
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    marginBottom: Spacings.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
