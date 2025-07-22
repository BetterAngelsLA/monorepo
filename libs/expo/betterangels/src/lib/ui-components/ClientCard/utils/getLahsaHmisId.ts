import { HmisProfileType, Maybe } from '../../../apollo';

export function getLahsaHmisId(
  hmisProfiles: Maybe<HmisProfileType[] | undefined>
) {
  return hmisProfiles?.find((profile) => profile?.agency === 'LAHSA')?.hmisId;
}
