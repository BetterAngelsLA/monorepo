import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { RelevantContact } from '../RelevantContacts/RelevantContact';
import { EmptyState } from './EmptyState';

type TProps = {
  clientProfile?: TClientProfile;
};

export function HouseholdMembers(props: TProps) {
  const { clientProfile } = props;

  const { householdMembers } = clientProfile || {};

  if (!householdMembers?.length) {
    return (
      <ClientProfileCardContainer>
        <EmptyState />
      </ClientProfileCardContainer>
    );
  }

  return (
    <ClientProfileCardContainer>
      {householdMembers.map((member, idx) => {
        return <RelevantContact key={idx} member={member} />;
      })}
    </ClientProfileCardContainer>
  );
}
