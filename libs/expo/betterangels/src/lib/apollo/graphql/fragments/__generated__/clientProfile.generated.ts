import * as Types from '../../__generated__/types';

import { gql } from '@apollo/client';
export type FullClientProfileFieldsFragment = { __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, heightInInches?: number | null, mailingAddress?: string | null, nickname?: string | null, residenceAddress?: string | null, displayCaseManager: string, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', id: string, agency: Types.HmisAgencyEnum, hmisId: string }> | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, username: string } };

export const FullClientProfileFieldsFragmentDoc = gql`
    fragment FullClientProfileFields on ClientProfileType {
  id
  age
  dateOfBirth
  heightInInches
  mailingAddress
  nickname
  residenceAddress
  hmisProfiles {
    id
    agency
    hmisId
  }
  profilePhoto {
    name
    url
  }
  user {
    id
    email
    firstName
    lastName
    username
  }
  displayCaseManager
}
    `;