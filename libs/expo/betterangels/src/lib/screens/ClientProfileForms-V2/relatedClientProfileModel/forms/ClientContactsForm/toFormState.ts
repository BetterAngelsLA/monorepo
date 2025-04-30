import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { TClientContactFormState } from './types';

export const formKeys = Object.keys(
  {} as TClientContactFormState
) as (keyof TClientContactFormState)[];

export const defaultFormState: TClientContactFormState = {
  relationshipToClient: undefined,
  name: '',
  email: '',
  phoneNumber: '',
  mailingAddress: '',
};

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function toFormState(props: TProps): TClientContactFormState {
  const { clientProfile, relationId } = props;

  if (!relationId) {
    return defaultFormState;
  }

  const contact = clientProfile?.contacts?.find((c) => c.id === relationId);

  const { name, email, phoneNumber, mailingAddress, relationshipToClient } =
    contact || {};

  return {
    name: name || '',
    email: email || undefined,
    phoneNumber: phoneNumber || '',
    mailingAddress: mailingAddress || '',
    relationshipToClient: relationshipToClient || undefined,
  };
}
