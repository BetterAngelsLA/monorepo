import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GetShelterOperatorOverviewDocument } from '../../components/overview/__generated__/overview.generated';
import { ShelterReportPage } from './ShelterReportPage';

// The page only orchestrates; the PDF itself is covered in useExportPdf.test.
vi.mock('./useExportPdf', () => ({
  useExportPdf: () => ({ exportPdf: vi.fn(), isExporting: false }),
}));

const SHELTER_ID = '1';

const OVERVIEW = {
  __typename: 'OperatorShelterType',
  id: SHELTER_ID,
  name: 'Downtown Emergency Shelter',
  organization: {
    __typename: 'OrganizationType',
    id: '1',
    name: 'Test Organization',
  },
  location: {
    __typename: 'ShelterLocationType',
    place: '1234 S Main St, Los Angeles, CA 90015',
  },
  bedCounts: {
    __typename: 'BedCountType',
    total: 185,
    available: 42,
    occupied: 118,
    reserved: 13,
    inTurnaround: 7,
    outOfService: 5,
  },
  roomCounts: {
    __typename: 'RoomCountType',
    total: 47,
    available: 9,
    occupied: 31,
    reserved: 4,
    inTurnaround: 2,
    outOfService: 1,
  },
};

const request = {
  query: GetShelterOperatorOverviewDocument,
  variables: { shelterId: SHELTER_ID },
};

function renderPage(mocks: Parameters<typeof MockedProvider>[0]['mocks']) {
  return render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={[`/operator/shelter/${SHELTER_ID}/report`]}>
        <Routes>
          <Route
            path="/operator/shelter/:shelterId/report"
            element={<ShelterReportPage />}
          />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );
}

const exportButton = () => screen.getByRole('button', { name: /export pdf/i });

describe('ShelterReportPage', () => {
  it('shows a loading message while the query is in flight', () => {
    renderPage([{ request, result: { data: { operatorShelter: OVERVIEW } } }]);

    expect(screen.getByText('Loading report…')).toBeTruthy();
  });

  it('disables the export button until the data arrives', async () => {
    renderPage([{ request, result: { data: { operatorShelter: OVERVIEW } } }]);

    expect(exportButton().hasAttribute('disabled')).toBe(true);

    await waitFor(() =>
      expect(screen.getByText('Test Organization')).toBeTruthy()
    );

    expect(exportButton().hasAttribute('disabled')).toBe(false);
  });

  it('renders the report once the query resolves', async () => {
    renderPage([{ request, result: { data: { operatorShelter: OVERVIEW } } }]);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Bed Summary' })).toBeTruthy()
    );

    expect(screen.getByRole('heading', { name: 'Room Summary' })).toBeTruthy();
    expect(screen.queryByText('Loading report…')).toBeNull();
  });

  it('reports a failure instead of an empty report when the query errors', async () => {
    renderPage([{ request, error: new Error('network down') }]);

    await waitFor(() =>
      expect(screen.getByText('Failed to load the shelter report.')).toBeTruthy()
    );

    expect(exportButton().hasAttribute('disabled')).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Bed Summary' })).toBeNull();
  });

  it('explains an empty result rather than rendering a blank report', async () => {
    renderPage([{ request, result: { data: { operatorShelter: null } } }]);

    await waitFor(() =>
      expect(
        screen.getByText('No shelter data available for this report.')
      ).toBeTruthy()
    );

    expect(exportButton().hasAttribute('disabled')).toBe(true);
  });
});
