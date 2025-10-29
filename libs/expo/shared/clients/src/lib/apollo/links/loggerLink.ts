import { ApolloLink } from '@apollo/client';

export const loggerLink = new ApolloLink((operation, forward) => {
  console.log(
    '[GraphQL req operation]',
    operation.operationName || '(anonymous)'
  );

  if (operation.variables && Object.keys(operation.variables).length > 0) {
    console.log('Variables:', operation.variables);
  }

  return forward(operation).map((result) => {
    console.log(
      '[GraphQL resp]',
      operation.operationName || '(anonymous)',
      result
    );
    console.log('[GraphQL resp pretty]');
    console.log(JSON.stringify(result, null, 2));

    return result;
  });
});
