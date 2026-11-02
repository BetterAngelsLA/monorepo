import { MockedProvider } from '@apollo/client/testing/react';
import { AuditEventKind, AuditTargetType } from '@monorepo/ba-platform/types';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ObjectAuditLogDocument } from '../../hooks/useObjectAuditLog/__generated__/useObjectAuditLog.generated';
import { ShelterActivityPage } from './ActivityPage';

const variables = {
  targetType: AuditTargetType.Shelter,
  objectId: 'shelter-1',
  limit: 25,
};

const page = {
  request: { query: ObjectAuditLogDocument, variables },
  result: {
    data: {
      objectAuditLog: {
        __typename: 'AuditActionPage',
        endCursor: null,
        hasNextPage: false,
        results: [
          {
            __typename: 'AuditActionType',
            timestamp: '2026-07-01T12:00:00Z',
            actor: 'Ada Lovelace',
            truncated: false,
            fieldChanges: { name: ['Shelter A', 'Shelter B'] },
            events: [
              {
                __typename: 'AuditEventType',
                timestamp: '2026-07-01T12:00:00Z',
                kind: AuditEventKind.Update,
                action: 'shelter.update',
                summary: null,
                context: null,
                fieldChanges: { name: ['Shelter A', 'Shelter B'] },
              },
            ],
          },
        ],
      },
    },
  },
};

function renderPage() {
  return render(
    <MockedProvider mocks={[page]} showWarnings={false}>
      <MemoryRouter
        initialEntries={['/operator/shelter/shelter-1/profile/activity']}
      >
        <Routes>
          <Route
            path="/operator/shelter/:shelterId/profile/activity"
            element={<ShelterActivityPage />}
          />
        </Routes>
      </MemoryRouter>
    </MockedProvider>,
  );
}

describe('ShelterActivityPage', () => {
  it('titles the page and links back to Basic Info', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Activity' }),
    ).not.toBeNull();
    expect(
      screen
        .getByRole('link', { name: 'Back to Basic Info' })
        .getAttribute('href'),
    ).toBe('/operator/shelter/shelter-1/profile/basic-info');

    // The mock is keyed on the SHELTER target and the route's shelter id, so a
    // rendered action proves the page queried the right object.
    expect(await screen.findByText('Ada Lovelace')).not.toBeNull();
  });
});
