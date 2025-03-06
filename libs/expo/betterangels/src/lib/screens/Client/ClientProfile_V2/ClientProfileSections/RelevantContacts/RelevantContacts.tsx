import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { RelevantContact } from './RelevantContact';

type TProps = {
  clientProfile?: TClientProfile;
};

export function RelevantContacts(props: TProps) {
  const { clientProfile } = props;

  const { contacts } = clientProfile || {};

  if (!contacts?.length) {
    return null;
  }

  return (
    <ClientProfileCardContainer>
      {contacts.map((contact, idx) => {
        return <RelevantContact key={idx} contact={contact} />;
      })}
    </ClientProfileCardContainer>
  );
}
