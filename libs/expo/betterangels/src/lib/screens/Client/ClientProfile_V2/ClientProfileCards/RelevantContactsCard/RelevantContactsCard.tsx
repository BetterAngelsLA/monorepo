import { RelationshipTypeEnum } from '../../../../../apollo';
import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { EmptyState } from './EmptyState';
import { RelevantContactCard } from './RelevantContactCard';

type TProps = {
  clientProfile?: TClientProfile;
};

export function RelevantContactsCard(props: TProps) {
  const { clientProfile } = props;

  const { contacts } = clientProfile || {};

  const clientContacts = contacts || [];

  const caseManagers = clientContacts.filter(
    (contact) =>
      contact.relationshipToClient === RelationshipTypeEnum.CurrentCaseManager
  );

  const otherContacts = clientContacts.filter((contact) => {
    const { relationshipToClient } = contact;

    return relationshipToClient !== RelationshipTypeEnum.CurrentCaseManager;
  });

  return (
    <ClientProfileCardContainer>
      {!caseManagers.length && <EmptyState title="Current Case Manager" />}

      {!!caseManagers.length &&
        caseManagers.map((contact, idx) => {
          return <RelevantContactCard key={idx} contact={contact} />;
        })}

      {!otherContacts.length && (
        <EmptyState
          title="Other Contacts"
          subtitle="(Mother, Aunt, Child, etc)"
        />
      )}

      {!!otherContacts.length &&
        otherContacts.map((contact, idx) => {
          return <RelevantContactCard key={idx} contact={contact} />;
        })}
    </ClientProfileCardContainer>
  );
}
