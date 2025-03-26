import { Spacings } from '@monorepo/expo/shared/static';
import { Form, MultiSelect } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  PreferredCommunicationEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplayPreferredCommunication } from '../../../static';

// TODO: Add Icons in preffered
// const icons = {
//   [PreferredCommunicationEnum.Call]: (
//     <CallIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
//   ),
//   [PreferredCommunicationEnum.Email]: (
//     <EmailIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
//   ),
//   [PreferredCommunicationEnum.Facebook]: (
//     <FacebookIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
//   ),
//   [PreferredCommunicationEnum.Instagram]: (
//     <InstagramIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
//   ),
//   [PreferredCommunicationEnum.Linkedin]: (
//     <LinkedinIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
//   ),
//   [PreferredCommunicationEnum.Text]: (
//     <ChatBubbleIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
//   ),
//   [PreferredCommunicationEnum.Whatsapp]: (
//     <WhatsappIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
//   ),
// };

export default function PreferredCommunication() {
  const { setValue, watch } = useFormContext<UpdateClientProfileInput>();

  const preferredCommunication = watch('preferredCommunication') || [];
  return (
    <Form.Field style={{ gap: Spacings.sm }} title="Preferred Communication">
      <MultiSelect
        onChange={(e: { id: PreferredCommunicationEnum; label: string }[]) => {
          const selectedEnums = e.map((item) => item.id);
          setValue('preferredCommunication', selectedEnums);
        }}
        options={(
          Object.entries(enumDisplayPreferredCommunication) as [
            PreferredCommunicationEnum,
            string
          ][]
        ).map(([enumValue, displayValue]) => ({
          id: enumValue,
          label: displayValue,
        }))}
        selected={preferredCommunication.map((item) => ({
          id: item,
          label: enumDisplayPreferredCommunication[item],
        }))}
        valueKey="id"
        labelKey="label"
      />
    </Form.Field>
  );
}
