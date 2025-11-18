import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateShelterForm from './components/create-shelter-form';
import { CREATE_SHELTER_MUTATION, buildCreateShelterInput } from './components/create-shelter-form/api/createShelterMutation';
import { validateShelterForm } from './components/create-shelter-form/constants/validation';
import { createEmptyShelterFormData } from './components/create-shelter-form/constants/defaultShelterFormData';
import type { ShelterFormData } from './types';
import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
  StorageChoices,
  StatusChoices,
} from '@monorepo/react/shelter';

const renderForm = (mocks: MockedResponse[] = []) =>
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CreateShelterForm />
      </MemoryRouter>
    </MockedProvider>
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
      const formDataForMutation: ShelterFormData = {
        ...createEmptyShelterFormData(),
        name: 'Safe Haven',
        description: 'Safe haven description',
        demographics: [DemographicChoices.All],
        special_situation_restrictions: [SpecialSituationRestrictionChoices.None],
        storage: [StorageChoices.SharedStorage],
        pets: [PetChoices.Cats],
        parking: [ParkingChoices.Automobile],
        status: StatusChoices.Draft,
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: CREATE_SHELTER_MUTATION,
            variables: {
              input: buildCreateShelterInput(formDataForMutation),
            },
          },
          result: {
            data: {
              createShelter: {
                __typename: 'ShelterType',
                id: '1',
                name: 'Safe Haven',
                status: 'DRAFT',
              },
            },
          },
        },
      ];

      renderForm(mocks);

      fireEvent.change(screen.getByLabelText(/shelter name/i), { target: { value: 'Safe Haven' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Safe haven description' } });

      clickCheckbox('demographics', DemographicChoices.All);
      clickCheckbox('special-situation', SpecialSituationRestrictionChoices.None);
      clickCheckbox('storage', StorageChoices.SharedStorage);
      clickCheckbox('pets', PetChoices.Cats);
      clickCheckbox('parking', ParkingChoices.Automobile);

      fireEvent.submit(screen.getByTestId('create-shelter-form'));

      await waitFor(() => {
        expect(screen.queryAllByTestId('field-error')).toHaveLength(0);
      });
    },
    15000
  );
});
