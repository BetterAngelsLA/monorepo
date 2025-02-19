import { gql } from '@apollo/client';

export const FULL_CLIENT_PROFILE_FIELDS_FRAGMENT = gql`
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
