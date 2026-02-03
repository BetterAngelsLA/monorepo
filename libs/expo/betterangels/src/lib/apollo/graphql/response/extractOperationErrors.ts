import { ApolloLink } from '@apollo/client';
import {
  OperationInfo,
  OperationMessage,
  OperationMessageKind,
} from '../__generated__/types';
import { extractOperationInfo } from './extractOperationInfo';
import { extractOperationInfoMessage } from './extractOperationInfoMessage';
import { hasTypename } from './utils';

type TOperationErrorsResponse = {
  validationErrors?: OperationMessage[];
  errorMessage?: string;
};

type TProps = {
  response: ApolloLink.Result;
  queryKey: string;
  fields: string[];
  resultTypename: string;
};

export function extractOperationErrors(
  props: TProps
): TOperationErrorsResponse {
  const { response, queryKey, fields, resultTypename } = props;

  // server error - return message
  if (response.errors?.length) {
    return {
      errorMessage: response.errors[0].message,
    };
  }

  const operationInfo: OperationInfo | null = extractOperationInfo(
    response,
    queryKey
  );

  const operationMessages = operationInfo?.messages || [];

  const validationErrors = operationMessages.filter((m) => {
    return (
      m.__typename === 'OperationMessage' &&
      m.kind === OperationMessageKind.Validation &&
      m.field &&
      fields.includes(m.field)
    );
  });

  // return form field validationErrors
  if (validationErrors.length) {
    return {
      validationErrors,
    };
  }

  const operationInfoMessage = extractOperationInfoMessage(response, queryKey);

  // other unhandled error
  if (operationInfoMessage) {
    return {
      errorMessage: operationInfoMessage,
    };
  }

  // invalid response typename
  if (!hasTypename(response.data?.[queryKey], resultTypename)) {
    return {
      errorMessage: `missing [${resultTypename}] typename in result`,
    };
  }

  // return ok
  return {};
}
