import { fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { ReportsPage } from './ReportsPage';

// The charts and their metrics query are this tab's existing content, not what
// this page adds — stub them out so the nav wiring is what's under test.
vi.mock('../../components/reports/ReportsView', () => ({
  ReportsView: ({ shelterId }: { shelterId?: string }) => (
    <div data-testid="reports-view">reports for {shelterId}</div>
  ),
}));

function LocationProbe() {
  const { pathname } = useLocation();
  const { shelterId } = useParams();

  return <div data-testid="location">{`${pathname} (shelter ${shelterId})`}</div>;
}

function renderReportsTab(shelterId = '5') {
  return render(
    <MemoryRouter
      initialEntries={[`/operator/shelter/${shelterId}/manage/reports`]}
    >
      <Routes>
        <Route
          path="/operator/shelter/:shelterId/manage/reports"
          element={<ReportsPage />}
        />
        <Route
          path="/operator/shelter/:shelterId/report"
          element={<LocationProbe />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ReportsPage', () => {
  it('renders the existing reports view for the current shelter', () => {
    renderReportsTab('5');

    expect(screen.getByTestId('reports-view').textContent).toBe(
      'reports for 5'
    );
  });

  it('navigates to the printable report for the current shelter', () => {
    renderReportsTab('5');

    fireEvent.click(screen.getByRole('button', { name: /printable report/i }));

    expect(screen.getByTestId('location').textContent).toBe(
      '/operator/shelter/5/report (shelter 5)'
    );
  });

  it('carries the shelter id through rather than hardcoding one', () => {
    renderReportsTab('42');

    fireEvent.click(screen.getByRole('button', { name: /printable report/i }));

    expect(screen.getByTestId('location').textContent).toBe(
      '/operator/shelter/42/report (shelter 42)'
    );
  });

  it('renders the report link as a button, not a nested anchor', () => {
    renderReportsTab();

    const button = screen.getByRole('button', { name: /printable report/i });

    expect(button.closest('a')).toBeNull();
    expect(screen.queryByRole('link', { name: /printable report/i })).toBeNull();
  });
});
