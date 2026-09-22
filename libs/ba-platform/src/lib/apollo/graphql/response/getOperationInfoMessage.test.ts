import { OperationMessageKind } from '../__generated__/types';
import { getOperationInfoMessage } from './getOperationInfoMessage';
import type { GraphQLResponse } from './types';

function opInfoResponse(
  ...messages: Array<{ kind: OperationMessageKind; message?: string }>
): GraphQLResponse {
  return {
    data: {
      defaultOperationName: {
        __typename: 'OperationInfo',
        messages: messages.map((m) => ({
          __typename: 'OperationMessage' as const,
          kind: m.kind,
          message: m.message ?? '',
        })),
      },
    },
  };
}

const successResponse: GraphQLResponse = {
  data: {
    defaultOperationName: { __typename: 'ClientDocumentType', id: '1' },
  },
};

describe('getOperationInfoMessage', () => {
  it('returns null when there is no OperationInfo payload', () => {
    expect(
      getOperationInfoMessage(successResponse, 'defaultOperationName'),
    ).toBeNull();
  });

  it('returns null when the response has no data', () => {
    expect(getOperationInfoMessage({}, 'defaultOperationName')).toBeNull();
  });

  it('returns the first message when no kind is given', () => {
    const response = opInfoResponse(
      { kind: OperationMessageKind.Error, message: 'first' },
      { kind: OperationMessageKind.Validation, message: 'second' },
    );

    expect(
      getOperationInfoMessage(response, 'defaultOperationName')?.message,
    ).toBe('first');
  });

  it('returns the first message of the requested kind', () => {
    const response = opInfoResponse(
      { kind: OperationMessageKind.Validation, message: 'nope' },
      { kind: OperationMessageKind.Permission, message: 'permission denied' },
    );

    expect(
      getOperationInfoMessage(
        response,
        'defaultOperationName',
        OperationMessageKind.Permission,
      )?.message,
    ).toBe('permission denied');
  });

  it('returns null when no message matches the requested kind', () => {
    const response = opInfoResponse({
      kind: OperationMessageKind.Validation,
      message: 'nope',
    });

    expect(
      getOperationInfoMessage(
        response,
        'defaultOperationName',
        OperationMessageKind.Permission,
      ),
    ).toBeNull();
  });
});
