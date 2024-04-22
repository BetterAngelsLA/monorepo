import * as Types from '../../../../types';

export type CurrentUserQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } };
