import { TFieldError } from '../../../errors';
import { OperationMessageKind } from '../__generated__/types';
import { extractOperationInfo } from './extractOperationInfo';

type TProps<TData, TDataKey> = {
  data: TData | null | undefined;
  dataKey: TDataKey;
  types?: OperationMessageKind[];
  fieldNames?: string[];
};

export function extractOperationFieldErrors<
  TData,
  TDataKey extends keyof TData & string
>(props: TProps<TData, TDataKey>): TFieldError[] {
  const {
    data,
    dataKey,
    fieldNames,
    types = [OperationMessageKind.Validation],
  } = props;

  const operationInfo = extractOperationInfo(data, dataKey);

  if (!operationInfo) {
    return [];
  }

  const fieldErrors = operationInfo.messages
    .filter((m) => {
      if (m.__typename !== 'OperationMessage') {
        return false;
      }

      if (!types?.length) {
        return true;
      }

      return types.includes(m.kind);
    })
    .map((msg) => ({
      field: msg.field as string,
      message: msg.message,
    }));

  if (fieldNames?.length) {
    return fieldErrors.filter((m) => fieldNames.includes(m.field));
  }

  return fieldErrors;
}
