import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  SocialMediaEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplaySocialMedia } from '../../../static/enumDisplayMapping';

const allowedPlatforms = [
  SocialMediaEnum.Facebook,
  SocialMediaEnum.Instagram,
  SocialMediaEnum.Linkedin,
  SocialMediaEnum.Tiktok,
  SocialMediaEnum.Whatsapp,
];

export default function SocialMedia() {
  const { control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const { fields, replace } = useFieldArray({
    control,
    name: 'socialMediaProfiles',
  });

  const handleReset = () => {
    const resetFields = Object.values(allowedPlatforms).map((platform) => ({
      platform,
      platformUserId: '',
    }));
    replace(resetFields);
  };

  return (
    <CardWrapper title="Social Media">
      <View style={{ gap: Spacings.xs }}>
        {fields.map((field, index) => (
          <Input
            key={field.id}
            placeholder={`Enter ${
              field.platform && enumDisplaySocialMedia[field.platform]
            } username`}
            label={
              (field.platform && enumDisplaySocialMedia[field.platform]) || ''
            }
            name={`socialMediaProfiles.${index}.platformUserId`}
            control={control}
          />
        ))}

        <View style={{ alignItems: 'flex-end' }}>
          <TextButton
            mt="sm"
            color={Colors.PRIMARY}
            title="Reset"
            accessibilityHint="Resets social media profiles"
            onPress={handleReset}
          />
        </View>
      </View>
    </CardWrapper>
  );
}
