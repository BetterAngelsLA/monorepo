import { ApolloLink } from '@apollo/client';

export const loggerLink = new ApolloLink((operation, forward) => {
  console.log(
    '[GraphQL operation →]',
    operation.operationName || '(anonymous)'
  );

  console.log(operation.query);

  if (operation.variables && Object.keys(operation.variables).length > 0) {
    console.log('Variables:', operation.variables);
  }

  return forward(operation).map((result) => {
    console.log(
      '[GraphQL ←]',
      operation.operationName || '(anonymous)',
      result
    );

    return result;
  });
});
