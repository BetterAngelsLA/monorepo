import { ApolloLink } from '@apollo/client';
import { extractOperationInfo } from './extractOperationInfo';

export function extractOperationInfoMessage<T>(
  response: ApolloLink.Result,
  queryKey: string
): string | null {
  const operationInfo = extractOperationInfo(response, queryKey);

  const operationMessages = operationInfo?.messages;

  if (!operationMessages) {
    return null;
  }

  const operationMessage = operationMessages.find((m) => {
    return m.__typename === 'OperationMessage';
  });

  return operationMessage?.message || null;
}
