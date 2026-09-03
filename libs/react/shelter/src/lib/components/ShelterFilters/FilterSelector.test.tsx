/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { demographicFilter, UNKNOWN_FILTER_VALUE } from './config';
import { FilterSelector } from './FilterSelector';

describe('FilterSelector', () => {
  const options = demographicFilter.options;

  it('preserves hidden selections when toggling a visible option', () => {
    const onChange = vi.fn();

    render(
      <FilterSelector
        header="Demographic"
        name={demographicFilter.name}
        options={options}
        values={[UNKNOWN_FILTER_VALUE]}
        expanded
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Couples',
      }),
    );

    expect(onChange).toHaveBeenCalledTimes(1);

    const [, selectedValues] = onChange.mock.calls[0];

    expect(selectedValues).toContain(UNKNOWN_FILTER_VALUE);
    expect(selectedValues).toContain(
      String(options.find((option) => option.label === 'Couples')!.value),
    );
  });

  it('selects all options when Select All is clicked while collapsed', () => {
    const onChange = vi.fn();

    render(
      <FilterSelector
        header="Demographic"
        name={demographicFilter.name}
        options={options}
        values={[]}
        expanded
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Select All',
      }),
    );

    const expectedValues = options.map((option) => String(option.value));

    expect(onChange).toHaveBeenCalledWith(
      demographicFilter.name,
      expect.arrayContaining(expectedValues),
    );

    expect(onChange.mock.calls[0][1]).toHaveLength(expectedValues.length);
  });

  it('clears all options when Select All is clicked while all options are selected', () => {
    const onChange = vi.fn();

    const allValues = options.map((option) => option.value);

    render(
      <FilterSelector
        header="Demographic"
        name={demographicFilter.name}
        options={options}
        values={allValues}
        expanded
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Select All',
      }),
    );

    expect(onChange).toHaveBeenCalledWith(demographicFilter.name, []);
  });

  it('renders Select All and 6 options while collapsed', () => {
    render(
      <FilterSelector
        header="Demographic"
        name={demographicFilter.name}
        options={options}
        values={[]}
        expanded
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: 'Select All',
      }),
    ).toBeDefined();

    expect(
      screen.getByRole('button', {
        name: 'Couples',
      }),
    ).toBeDefined();

    expect(
      screen.getByRole('button', {
        name: 'Families',
      }),
    ).toBeDefined();

    expect(
      screen.getByRole('button', {
        name: 'LGBTQ+',
      }),
    ).toBeDefined();

    expect(
      screen.getByRole('button', {
        name: 'Others',
      }),
    ).toBeDefined();

    expect(
      screen.getByRole('button', {
        name: 'Seniors',
      }),
    ).toBeDefined();

    expect(
      screen.getByRole('button', {
        name: 'Single Men',
      }),
    ).toBeDefined();

    expect(
      screen.queryByRole('button', {
        name: 'Single Moms',
      }),
    ).toBeNull();

    expect(
      screen.getByRole('button', {
        name: 'Show More Options',
      }),
    ).toBeDefined();
  });

  it('shows all options after clicking Show More Options', () => {
    render(
      <FilterSelector
        header="Demographic"
        name={demographicFilter.name}
        options={options}
        values={[]}
        expanded
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', {
        name: 'Include Unknown',
      }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Show More Options',
      }),
    );

    expect(
      screen.getByRole('button', {
        name: 'Include Unknown',
      }),
    ).toBeDefined();

    expect(
      screen.getByRole('button', {
        name: 'Show Less Options',
      }),
    ).toBeDefined();

    options.forEach((option) => {
      expect(
        screen.getByRole('button', {
          name: option.label,
        }),
      ).toBeDefined();
    });
  });
});
