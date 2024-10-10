import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  CardWrapper,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  SocialMediaEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplaySocialMedia } from '../../../static/enumDisplayMapping';

export default function SocialMedia() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const [socialMediaValues, setSocialMediaValues] = useState<{
    [key in SocialMediaEnum]: string;
  }>({});

  const handleInputChange = (platform: SocialMediaEnum, value: string) => {
    setSocialMediaValues((prevValues) => ({
      ...prevValues,
      [platform]: value,
    }));
  };

  const socialMediaProfiles = watch('socialMediaProfiles') || [];

  const socialMediaObject = Object.values(SocialMediaEnum).reduce(
    (acc, platform) => {
      const profile = socialMediaProfiles.find(
        (item) => item.platform === platform
      );
      acc[platform] = profile || { platform, platformUserId: '' };
      return acc;
    },
    {} as {
      [key in SocialMediaEnum]: {
        platform: SocialMediaEnum;
        platformUserId: string;
      };
    }
  );

  // Function to handle reset action
  const handleReset = () => {
    Object.values(SocialMediaEnum).forEach((platform) => {
      setValue(platform, {
        platform,
        platformUserId: '',
      });
    });
    setValue('socialMediaProfiles', []);
  };

  useEffect(() => {
    const initialValues = Object.values(SocialMediaEnum).reduce(
      (acc, platform) => {
        const profile = socialMediaProfiles.find(
          (item) => item.platform === platform
        );
        acc[platform] = profile?.platformUserId || '';
        return acc;
      },
      {} as { [key in SocialMediaEnum]: string }
    );
    setSocialMediaValues(initialValues);
  }, [socialMediaProfiles]);

  return (
    <CardWrapper title="Social Media">
      <View style={{ gap: Spacings.xs }}>
        {Object.values(SocialMediaEnum).map((platform) => (
          <BasicInput
            key={platform}
            value={socialMediaObject[platform].platformUserId}
            label={enumDisplaySocialMedia[platform]}
            onChangeText={(e) => handleInputChange(platform, e)}
          />
        ))}

        <View style={{ alignItems: 'flex-end' }}>
          <TextButton
            mt="sm"
            color={Colors.PRIMARY}
            title="Reset"
            accessibilityHint="resets SocialMedias"
            onPress={handleReset}
          />
        </View>
      </View>
    </CardWrapper>
  );
}
