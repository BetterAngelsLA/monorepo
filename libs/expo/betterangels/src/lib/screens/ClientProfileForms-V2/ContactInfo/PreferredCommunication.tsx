import { Spacings } from '@monorepo/expo/shared/static';
import { Form, MultiSelect } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  PreferredCommunicationEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplayPreferredCommunication } from '../../../static';

type TOption = { id: PreferredCommunicationEnum; label: string };

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

  const selectedCommunications = watch('preferredCommunication') || [];

  const options = useMemo(() => {
    return (
      Object.entries(enumDisplayPreferredCommunication) as [
        PreferredCommunicationEnum,
        string
      ][]
    ).map(([enumValue, displayValue]) => ({
      id: enumValue,
      label: displayValue,
    }));
  }, []);

  return (
    <Form.Field style={{ gap: Spacings.sm }} title="Preferred Communication">
      <MultiSelect<TOption>
        onChange={(selected) => {
          const selectedEnums = selected.map((item) => item.id);

          setValue('preferredCommunication', selectedEnums);
        }}
        options={options}
        selected={selectedCommunications.map((item) => ({
          id: item,
          label: enumDisplayPreferredCommunication[item],
        }))}
        valueKey="id"
        labelKey="label"
      />
    </Form.Field>
  );
}
