import { Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
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

export function getSocialMediaRows(props: TSocialMedias) {
  const { medias } = props;

  if (!medias?.length) {
    return [];
  }

  return medias.map((media) => {
    const row = <SocialMediaRow key={media.id} media={media} />;

    return [row];
  });
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
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: Spacings.xs,
      }}
    >
      {/* <SocialMediaIcon type={platform.toUpperCase() as TSocialMediaType} /> */}
      <TextBold size="sm">{enumDisplaySocialMedia[platform]}</TextBold>
      <TextRegular size="sm">-</TextRegular>
      <TextBold size="sm">{platformUserId}</TextBold>
    </View>
  );
}
