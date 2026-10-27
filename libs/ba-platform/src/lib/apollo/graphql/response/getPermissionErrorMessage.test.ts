import { OperationMessageKind } from '../__generated__/types';
import { getPermissionErrorMessage } from './getPermissionErrorMessage';
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
    defaultOperationName: { __typename: 'BulkDeleteResult', ids: ['1'] },
  },
};

describe('getPermissionErrorMessage', () => {
  it('returns null for a success payload', () => {
    expect(
      getPermissionErrorMessage(successResponse, 'defaultOperationName'),
    ).toBeNull();
  });

  it('returns null when the operation is missing from the response', () => {
    expect(
      getPermissionErrorMessage({ data: {} }, 'defaultOperationName'),
    ).toBe(null);
  });

  it('returns null when the OperationInfo holds no permission message', () => {
    const response = opInfoResponse(
      { kind: OperationMessageKind.Validation, message: 'URL is required' },
      { kind: OperationMessageKind.Error, message: 'Something broke' },
    );

    expect(
      getPermissionErrorMessage(response, 'defaultOperationName'),
    ).toBeNull();
  });

  it('returns the permission message', () => {
    const response = opInfoResponse(
      { kind: OperationMessageKind.Validation, message: 'URL is required' },
      { kind: OperationMessageKind.Permission, message: 'Not allowed' },
    );

    expect(getPermissionErrorMessage(response, 'defaultOperationName')).toBe(
      'Not allowed',
    );
  });

  it('returns null when the permission message is empty', () => {
    const response = opInfoResponse({
      kind: OperationMessageKind.Permission,
      message: '',
    });

    expect(
      getPermissionErrorMessage(response, 'defaultOperationName'),
    ).toBeNull();
  });
});
