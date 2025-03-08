import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { EmptyState } from './EmptyState';
import { HouseholdMember } from './HouseholdMember';

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
        return <HouseholdMember key={idx} member={member} />;
      })}
    </ClientProfileCardContainer>
  );
}
