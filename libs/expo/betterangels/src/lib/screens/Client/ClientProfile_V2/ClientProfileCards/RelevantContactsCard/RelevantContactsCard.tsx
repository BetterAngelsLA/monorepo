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

  if (!contacts?.length) {
    return (
      <ClientProfileCardContainer>
        <EmptyState />
      </ClientProfileCardContainer>
    );
  }

  return (
    <ClientProfileCardContainer>
      {contacts.map((contact, idx) => {
        return <RelevantContactCard key={idx} contact={contact} />;
      })}
    </ClientProfileCardContainer>
  );
}
