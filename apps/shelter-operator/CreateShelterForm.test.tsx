import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateShelterForm from './components/create-shelter-form';
import { validateShelterForm } from './components/create-shelter-form/constants/validation';
import { createEmptyShelterFormData } from './components/create-shelter-form/constants/defaultShelterFormData';

const renderForm = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CreateShelterForm />
    </MemoryRouter>
  );

const clickCheckbox = (name: string, value: string) => {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
  if (!input) {
    throw new Error(`Checkbox ${name}:${value} not found`);
  }
  fireEvent.click(input);
};

describe('CreateShelterForm', () => {
  it('validation fails for empty data', () => {
    const result = validateShelterForm(createEmptyShelterFormData());
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it(
    'shows validation errors when submitting an empty form',
    async () => {
      renderForm();

      fireEvent.submit(screen.getByTestId('create-shelter-form'));

      await waitFor(
        () => {
          const errors = screen.queryAllByTestId('field-error');
          expect(errors.length).toBeGreaterThanOrEqual(6);
        },
        { timeout: 10000 }
      );
    },
    15000
  );

  it(
    'submits successfully when required fields are populated',
    async () => {
      renderForm();

      fireEvent.change(screen.getByLabelText(/shelter name/i), { target: { value: 'Safe Haven' } });
      fireEvent.change(screen.getByLabelText(/organization/i), { target: { value: 'Hope Org' } });
      fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'Los Angeles, 34.05, -118.24' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'contact@hope.org' } });
      fireEvent.change(screen.getByLabelText(/intake hours/i), { target: { value: '08:00-17:00' } });
      fireEvent.change(screen.getByLabelText(/curfew/i), { target: { value: '21:00-06:00' } });
      fireEvent.change(screen.getByLabelText(/total beds/i), { target: { value: '20' } });

      clickCheckbox('demographics', 'All');
      clickCheckbox('shelter-types', 'Building');
      clickCheckbox('room-styles', 'Congregate (Open)');
      clickCheckbox('exit-policy', 'Exit after 72 hours of being MIA');
      clickCheckbox('entry-requirements', 'Medicaid or Medicare');
      clickCheckbox('referral-requirement', 'Matched Referral');

      fireEvent.submit(screen.getByTestId('create-shelter-form'));

      await waitFor(() => {
        expect(screen.queryAllByTestId('field-error')).toHaveLength(0);
      });
    },
    15000
  );
});
