import { StarIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  SocialMediaIcon,
  TSocialMediaType,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { View } from 'react-native';
import { SocialMediaEnum } from '../../../../apollo';
import {
  enumDisplayPreferredCommunication,
  enumDisplaySocialMedia,
} from '../../../../static';
import { ClientProfileCard } from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function ContactInfo(props: TProps) {
  const { clientProfile } = props;

  const {
    mailingAddress,
    phoneNumbers,
    preferredCommunication,
    socialMediaProfiles,
    user,
  } = clientProfile || {};

  const email = user?.email;

  const content = [
    {
      title: 'Personal mailing address',
      content: mailingAddress,
    },
    {
      title: (
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacings.xs,
          }}
        >
          <TextRegular size="sm">Phone Number(s)</TextRegular>
          <TextBold size="xs">Primary</TextBold>
        </View>
      ),
      content: <PhoneNumbers numbers={phoneNumbers} />,
    },
    {
      title: 'Email Address',
      content: email,
    },
    {
      title: 'Social Medias',
      content: <SocialMedias medias={socialMediaProfiles || []} />,
    },
    {
      title: 'Preferred Communication',
      content:
        preferredCommunication?.length &&
        preferredCommunication
          .map((pf) => enumDisplayPreferredCommunication[pf])
          .join(', '),
    },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit contact information',
        }}
      />
    </View>
  );
}

type TPhoneNumber = {
  number?: any;
  isPrimary?: boolean | null;
};

type TPhoneNumbers = {
  numbers?: TPhoneNumber[] | null;
};

function PhoneNumbers(props: TPhoneNumbers) {
  const { numbers } = props;

  if (!numbers?.length) {
    return null;
  }

  return (
    <View
      style={{
        display: 'flex',
        gap: Spacings.xs,
      }}
    >
      {numbers.map((phone, idx) => {
        return (
          <PhoneNumberRow
            key={idx}
            number={phone.number}
            isPrimary={phone.isPrimary}
          />
        );
      })}
    </View>
  );
}

function PhoneNumberRow(props: TPhoneNumber) {
  const { number, isPrimary } = props;

  if (!number) {
    return null;
  }

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <TextBold size="sm">{formatPhoneNumber(number)}</TextBold>

      {isPrimary && <StarIcon color={Colors.WARNING} />}
    </View>
  );
}

type TSocialMedia = {
  id?: string | null;
  platform: SocialMediaEnum;
  platformUserId: string;
};

type TSocialMedias = {
  medias: TSocialMedia[];
};

function SocialMedias(props: TSocialMedias) {
  const { medias } = props;

  if (!medias?.length) {
    return null;
  }

  return (
    <View style={{ gap: Spacings.xs }}>
      {medias.map((media) => {
        const { id } = media;

        return <SocialMediaRow key={id} media={media} />;
      })}
    </View>
  );
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
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacings.xs,
        }}
      >
        <SocialMediaIcon type={platform.toUpperCase() as TSocialMediaType} />

        <TextRegular size="sm">{enumDisplaySocialMedia[platform]}</TextRegular>
      </View>
      <TextBold size="sm">{platformUserId}</TextBold>
    </View>
  );
}
