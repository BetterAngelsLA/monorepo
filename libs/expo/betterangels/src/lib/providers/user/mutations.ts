import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
  mutation UpdateCurrentUser($data: UpdateUserInput!) {
    updateCurrentUser(data: $data) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on UserType {
        id
        hasAcceptedTos
        hasAcceptedPrivacyPolicy
      }
    }
  }
`;
