import { MockedProvider } from '@apollo/client/testing/react';
import { Alert } from '@monorepo/react/components';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateTeamDocument } from './__generated__/teams.generated';
import { TeamFormDrawer } from './TeamFormDrawer';

const DUPLICATE_MESSAGE =
  'A team named "Drop-in Center" already exists in this organization.';

const duplicateNameMock = {
  request: {
    query: CreateTeamDocument,
    variables: { data: { name: 'Drop-in Center' } },
  },
  result: {
    data: {
      createTeam: {
        __typename: 'OperationInfo',
        messages: [
          {
            __typename: 'OperationMessage',
            kind: 'VALIDATION',
            field: null,
            message: DUPLICATE_MESSAGE,
          },
        ],
      },
    },
  },
};

describe('TeamFormDrawer', () => {
  it('shows the message the server sent, not a generic one', async () => {
    render(
      <MockedProvider mocks={[duplicateNameMock]}>
        <>
          <TeamFormDrawer onSuccess={() => undefined} />
          <Alert />
        </>
      </MockedProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Outreach Team Alpha'), {
      target: { value: 'Drop-in Center' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByText(DUPLICATE_MESSAGE)).toBeTruthy(),
    );
    expect(screen.queryByText(/Sorry, something went wrong/)).toBeNull();
  });
});
