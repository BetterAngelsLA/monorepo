import {
  CallIcon,
  ChatBubbleIcon,
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsappIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Checkbox,
  Form,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  PreferredCommunicationEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplayPreferredCommunication } from '../../../static';

const icons = {
  [PreferredCommunicationEnum.Call]: (
    <CallIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Email]: (
    <EmailIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Facebook]: (
    <FacebookIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Instagram]: (
    <InstagramIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Linkedin]: (
    <LinkedinIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Text]: (
    <ChatBubbleIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
  [PreferredCommunicationEnum.Whatsapp]: (
    <WhatsappIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
  ),
};

export default function PreferredCommunication() {
  const { setValue, watch } = useFormContext<UpdateClientProfileInput>();

  const preferredCommunication = watch('preferredCommunication') || [];
  return (
    <Form.Field style={{ gap: Spacings.sm }} title="Preferred Communication">
      {(
        Object.entries(enumDisplayPreferredCommunication) as [
          PreferredCommunicationEnum,
          string
        ][]
      ).map(([enumValue, displayValue]) => (
        <Checkbox
          key={enumValue}
          isChecked={preferredCommunication.includes(enumValue)}
          hasBorder
          onCheck={() => {
            if (preferredCommunication.includes(enumValue)) {
              setValue(
                'preferredCommunication',
                preferredCommunication.filter((value) => value !== enumValue)
              );
              return;
            }
            setValue('preferredCommunication', [
              ...preferredCommunication,
              enumValue,
            ]);
          }}
          accessibilityHint={`Select ${displayValue}`}
          label={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {icons[enumValue as PreferredCommunicationEnum]}
              <TextRegular ml="xs">{displayValue}</TextRegular>
            </View>
          }
        />
      ))}
    </Form.Field>
  );
}
