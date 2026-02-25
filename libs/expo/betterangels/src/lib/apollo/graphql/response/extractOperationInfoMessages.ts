import { ApolloLink } from '@apollo/client';
import { OperationMessage, OperationMessageKind } from '../__generated__/types';
import { extractOperationInfo } from './extractOperationInfo';

export function extractOperationInfoMessages(
  response: ApolloLink.Result,
  queryKey: string,
  types?: OperationMessageKind[]
): OperationMessage[] | null {
  const operationInfo = extractOperationInfo(response, queryKey);

  if (!operationInfo) {
    return null;
  }

  const operationMessages = operationInfo.messages.filter((m) => {
    return m.__typename === 'OperationMessage';
  });

  if (!types?.length) {
    return operationMessages;
  }

  return operationMessages.filter((m) => {
    return types.includes(m.kind);
  });
}
