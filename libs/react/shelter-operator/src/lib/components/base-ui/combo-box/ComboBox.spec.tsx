import { fireEvent, render, screen } from '@testing-library/react';
import { ComboBox } from './ComboBox';

// The dropdown portal measures its anchor with ResizeObserver, which jsdom lacks.
class ResizeObserverStub {
  observe() {
    /* no-op */
  }
  unobserve() {
    /* no-op */
  }
  disconnect() {
    /* no-op */
  }
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

const OPTIONS = [
  { value: 'dorm', label: 'Dorm' },
  { value: 'other', label: 'Other' },
];

const OTHER_SELECTED = [{ value: 'other', label: 'Other' }];
const OTHER_NOT_SELECTED = [{ value: 'dorm', label: 'Dorm' }];

function renderComboBox(overrides: {
  value?: { value: string; label: string }[];
  inputValue?: string;
  onChange?: ReturnType<typeof vi.fn>;
  onInputChange?: ReturnType<typeof vi.fn>;
}) {
  const onChange = overrides.onChange ?? vi.fn();
  const onInputChange = overrides.onInputChange ?? vi.fn();

  render(
    <ComboBox
      label="Room Styles"
      inputLabel="Other Room Style"
      options={OPTIONS}
      triggerValue="other"
      inputMaxLength={255}
      value={overrides.value ?? OTHER_SELECTED}
      inputValue={overrides.inputValue ?? ''}
      onChange={onChange}
      onInputChange={onInputChange}
    />,
  );

  return { onChange, onInputChange };
}

describe('ComboBox', () => {
  it('applies inputMaxLength to the Other input', () => {
    renderComboBox({});

    const input = screen.getByLabelText('Other Room Style');

    expect((input as HTMLInputElement).maxLength).toBe(255);
  });

  it('hides the Other input when the trigger option is not selected', () => {
    renderComboBox({ value: OTHER_NOT_SELECTED });

    expect(screen.queryByLabelText('Other Room Style')).toBeNull();
  });

  it('passes null when the Other input is cleared', () => {
    const { onInputChange } = renderComboBox({ inputValue: 'Sleeping pods' });

    fireEvent.change(screen.getByLabelText('Other Room Style'), {
      target: { value: '' },
    });

    expect(onInputChange).toHaveBeenCalledWith(null);
  });

  it('clears the text value when the trigger option is deselected', () => {
    const { onChange, onInputChange } = renderComboBox({
      inputValue: 'Sleeping pods',
    });

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /Other/ }));

    // An empty multi-selection is emitted as null by Dropdown.
    expect(onChange).toHaveBeenCalledWith(null);
    expect(onInputChange).toHaveBeenCalledWith(null);
  });
});
