import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShelterServicesForm } from './ShelterServicesForm';

const CATEGORY = { id: 'cat-1', displayName: 'Shelter', services: [] };

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: { shelterServiceCategories: { results: [CATEGORY] } },
  }),
}));

// The category row is a separate concern; these cases are about how the form
// state follows the `values` prop, so the row is reduced to its selection.
vi.mock('./ServiceCategoryRow', () => ({
  default: ({
    category,
    selectedServiceIds,
    onSelectedServiceIdsChange,
  }: {
    category: { id: string };
    selectedServiceIds: string[];
    onSelectedServiceIdsChange: (next: string[]) => void;
  }) => (
    <div data-testid="service-row" data-selected={selectedServiceIds.join()}>
      <button
        onClick={() =>
          onSelectedServiceIdsChange([...selectedServiceIds, 'svc-extra'])
        }
      >
        Add extra ({category.id})
      </button>
    </div>
  ),
}));

const selectedServices = () =>
  screen.getByTestId('service-row').getAttribute('data-selected');

const onSubmitNoop = () => undefined;

describe('ShelterServicesForm', () => {
  it('re-syncs field values when the values prop changes (post-save refetch)', async () => {
    const { rerender } = render(
      <ShelterServicesForm
        values={{ services: ['svc-a'] }}
        onSubmit={onSubmitNoop}
      />,
    );

    expect(selectedServices()).toBe('svc-a');

    rerender(
      <ShelterServicesForm
        values={{ services: ['svc-b'] }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(selectedServices()).toBe('svc-b'));
  });

  it('keeps in-progress edits when the values content is unchanged', async () => {
    const { rerender } = render(
      <ShelterServicesForm
        values={{ services: ['svc-a'] }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Add extra/ }));

    expect(selectedServices()).toBe('svc-a,svc-extra');

    // Re-render with deep-equal data, e.g. a failed submit that refetches
    // nothing: the user's edits must survive.
    rerender(
      <ShelterServicesForm
        values={{ services: ['svc-a'] }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(selectedServices()).toBe('svc-a,svc-extra'));
  });

  it('restores the values prop on cancel', async () => {
    render(
      <ShelterServicesForm
        values={{ services: ['svc-a'] }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Add extra/ }));

    expect(selectedServices()).toBe('svc-a,svc-extra');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(selectedServices()).toBe('svc-a'));
  });
});
