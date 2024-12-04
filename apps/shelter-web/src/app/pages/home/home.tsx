import { Link } from 'react-router-dom';

import { gql, useQuery } from '@apollo/client';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      email
      username
    }
  }
`;

export function Home() {
  const { loading, error, data } = useQuery(GET_CURRENT_USER);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <h1>HELLO HOME PAGE component</h1>

      <div>{data}</div>

      <div className="mt-8">
        <div>ROOT page</div>
        <Link to="/page-2">go to page 2</Link>
      </div>
    </div>
  );
}
