import { fireEvent, render, screen } from '@testing-library/react';
import { ShelterMediaLinkForm } from './ShelterMediaLinkForm';
import { defaultFormValues } from './formSchema';

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

function renderForm() {
  return render(
    <ShelterMediaLinkForm
      defaultValues={defaultFormValues}
      onSubmit={vi.fn()}
    />,
  );
}

function openMediaTypeMenu() {
  fireEvent.click(screen.getByRole('combobox'));
}

describe('ShelterMediaLinkForm', () => {
  it('renders the URL field for the default media type', () => {
    renderForm();

    expect(screen.getByLabelText(/YouTube URL/)).toBeTruthy();
  });

  it('does not crash when the already-selected media type is clicked', () => {
    renderForm();
    openMediaTypeMenu();

    // Single-select dropdowns deselect when the active option is clicked, so
    // this sets `mediaType` to `null` before the form re-renders.
    const youtubeOption = screen.getByRole('option', { name: 'YouTube' });

    expect(() => fireEvent.click(youtubeOption)).not.toThrow();

    // The form must survive the empty selection: the schema, not the render,

    // owns reporting that a media type is required.
    expect(screen.getByLabelText(/YouTube URL/)).toBeTruthy();
  });
});
