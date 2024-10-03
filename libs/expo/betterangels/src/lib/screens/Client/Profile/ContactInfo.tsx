import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { IProfileSectionProps } from './types';

const InfoCol = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <View>
    <TextRegular mb="xs" size="sm">
      {label}
    </TextRegular>
    <TextBold size="sm">{value}</TextBold>
  </View>
);

export default function ContactInfo(props: IProfileSectionProps) {
  const { expanded, setExpanded, client } = props;

  const isContactInfo = expanded === 'Contact Info';

  const addresses = [
    {
      label: 'Residence Address',
      value: client?.clientProfile.residenceAddress,
    },
    {
      label: 'Personal Mailing Address',
      value: client?.clientProfile.mailingAddress,
    },
  ];

  return (
    <Accordion
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isContactInfo ? null : 'Contact Info');
      }}
      mb="xs"
      title="Contact Info"
    >
      {isContactInfo && (
        <View
          style={{
            height: isContactInfo ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          <CardWrapper>
            <View style={{ gap: Spacings.lg }}>
              {addresses
                .filter(({ value }) => value)
                .map(({ label, value }) => (
                  <InfoCol key={label} label={label} value={value} />
                ))}
            </View>
          </CardWrapper>
        </View>
      )}
    </Accordion>
  );
}
