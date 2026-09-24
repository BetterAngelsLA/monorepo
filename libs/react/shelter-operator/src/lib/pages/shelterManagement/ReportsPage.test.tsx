import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReportsPage } from './ReportsPage';

// The export flow and its data are ReportsView's concern, not this page's —
// stub it out so only the shelterId hand-off is under test.
vi.mock('../../components/reports/ReportsView', () => ({
  ReportsView: ({ shelterId }: { shelterId?: string }) => (
    <div data-testid="reports-view">reports for {shelterId}</div>
  ),
}));

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
      </Routes>
    </MemoryRouter>,
  );
}

describe('ReportsPage', () => {
  it('renders the reports view for the current shelter', () => {
    renderReportsTab('5');

    expect(screen.getByTestId('reports-view').textContent).toBe(
      'reports for 5',
    );
  });

  it('carries the shelter id through rather than hardcoding one', () => {
    renderReportsTab('42');

    expect(screen.getByTestId('reports-view').textContent).toBe(
      'reports for 42',
    );
  });
});
