import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import { RelationshipTypeEnum } from '../../../apollo';
import { clientRelevantContactEnumDisplay } from '../../../static/enumDisplayMapping';
import { IProfileSectionProps } from './types';

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <View>
    <TextRegular size="xs">{label}</TextRegular>
    <TextMedium size="sm">{value || ''}</TextMedium>
  </View>
);

const RelevantContacts = forwardRef<View, IProfileSectionProps>(
  (props, ref) => {
    const { expanded, setExpanded, client } = props;

    const isRelevantContacts = expanded === 'Relevant Contacts';

    const sortedContacts = useMemo(() => {
      const fields = client?.clientProfile.contacts ?? [];
      const caseManagerContact = fields.find(
        (contact) =>
          contact.relationshipToClient ===
          RelationshipTypeEnum.CurrentCaseManager
      );

      const otherContacts = fields
        .filter(
          (contact) =>
            contact.relationshipToClient !==
            RelationshipTypeEnum.CurrentCaseManager
        )
        .sort((a, b) =>
          (a.relationshipToClient ?? '').localeCompare(
            b.relationshipToClient ?? ''
          )
        );

      return caseManagerContact
        ? [caseManagerContact, ...otherContacts]
        : otherContacts;
    }, [client]);

    return (
      <Accordion
        expanded={expanded}
        setExpanded={() => {
          setExpanded(isRelevantContacts ? null : 'Relevant Contacts');
        }}
        mb="xs"
        title="Relevant Contacts"
      >
        {isRelevantContacts && (
          <View
            ref={ref}
            style={{
              height: isRelevantContacts ? 'auto' : 0,
              overflow: 'hidden',
              gap: Spacings.xs,
            }}
          >
            {sortedContacts.map((contact) => {
              const contactData = [
                { label: 'Name', value: contact.name },
                { label: 'Email Address', value: contact.email },
                {
                  label: 'Phone Number',
                  value: formatPhoneNumber(contact.phoneNumber),
                },
                { label: 'Mailing Address', value: contact.mailingAddress },
              ];

              return (
                <CardWrapper key={contact.id}>
                  <View style={{ gap: Spacings.sm }}>
                    <TextBold size="sm">
                      {contact.relationshipToClient &&
                        clientRelevantContactEnumDisplay[
                          contact.relationshipToClient
                        ]}
                    </TextBold>
                    {contact.relationshipToClient ===
                      RelationshipTypeEnum.Other && (
                      <InfoRow
                        label="Type of Relationship"
                        value={contact.relationshipToClientOther}
                      />
                    )}
                    {contactData
                      .filter(({ value }) => value)
                      .map(({ label, value }) => (
                        <InfoRow key={label} label={label} value={value} />
                      ))}
                  </View>
                </CardWrapper>
              );
            })}
          </View>
        )}
      </Accordion>
    );
  }
);

export default RelevantContacts;
