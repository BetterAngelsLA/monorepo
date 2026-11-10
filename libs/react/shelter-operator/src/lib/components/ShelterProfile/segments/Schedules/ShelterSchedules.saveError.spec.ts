import { operationInfoMessage } from './ShelterSchedules';

describe('operationInfoMessage', () => {
  it('joins the server messages so the toast can show them', () => {
    expect(
      operationInfoMessage({
        __typename: 'OperationInfo',
        messages: [
          {
            message:
              'Operating Hours: Monday already has a slot starting at 09:00.',
          },
          { message: 'Schedule 42 does not belong to this shelter.' },
        ],
      }),
    ).toBe(
      'Operating Hours: Monday already has a slot starting at 09:00. Schedule 42 does not belong to this shelter.',
    );
  });

  it('is undefined when the payload succeeded', () => {
    expect(operationInfoMessage({ __typename: 'ShelterType' })).toBeUndefined();
  });

  it('is undefined when the rejection carries no text', () => {
    expect(
      operationInfoMessage({ __typename: 'OperationInfo', messages: [] }),
    ).toBeUndefined();
  });
});
