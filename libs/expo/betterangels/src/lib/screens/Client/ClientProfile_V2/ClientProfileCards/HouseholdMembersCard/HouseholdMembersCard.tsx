import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { EmptyState } from './EmptyState';
import { HouseholdMemberCard } from './HouseholdMemberCard';

type TProps = {
  clientProfile?: TClientProfile;
};

export function HouseholdMembersCard(props: TProps) {
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
        return <HouseholdMemberCard key={idx} member={member} />;
      })}
    </ClientProfileCardContainer>
  );
}
