import { Spacings } from '@monorepo/expo/shared/static';
import {
  SocialMediaIcon,
  TSocialMediaType,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { SocialMediaEnum } from '../../../../../apollo';
import { enumDisplaySocialMedia } from '../../../../../static';

type TSocialMedia = {
  id?: string | null;
  platform: SocialMediaEnum;
  platformUserId: string;
};

type TSocialMedias = {
  medias: TSocialMedia[];
};

export function SocialMediaRows(props: TSocialMedias) {
  const { medias } = props;

  if (!medias?.length) {
    return [];
  }

  const content = (
    <View style={styles.container}>
      {medias.map((media) => (
        <SocialMediaRow key={media.id} media={media} />
      ))}
    </View>
  );

  return [[content]];
}

type TSocialMediaRow = {
  media: TSocialMedia;
};

function SocialMediaRow(props: TSocialMediaRow) {
  const {
    media: { platform, platformUserId },
  } = props;

  if (!platformUserId) {
    return null;
  }

  return (
    <View style={styles.socialMediaRow}>
      <View style={styles.socialMediaType}>
        <SocialMediaIcon type={platform.toUpperCase() as TSocialMediaType} />
        <TextRegular size="sm">{enumDisplaySocialMedia[platform]}</TextRegular>
      </View>
      <TextBold size="sm">{platformUserId}</TextBold>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.sm,
  },
  socialMediaRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  socialMediaType: {
    display: 'flex',
    flexDirection: 'row',
    gap: Spacings.xs,
    marginBottom: Spacings.xxs,
    alignItems: 'center',
  },
});
