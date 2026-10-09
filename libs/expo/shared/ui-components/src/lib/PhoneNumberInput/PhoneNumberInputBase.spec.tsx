import { fireEvent, render } from '@testing-library/react-native';
import { PhoneNumberInputBase } from './PhoneNumberInputBase';

const baseProps = {
  noExtension: true,
  placeholderNumber: 'Enter phone number',
};

describe('PhoneNumberInputBase', () => {
  it('emits the initial value once on mount', () => {
    const onChangeParts = vi.fn();

    render(
      <PhoneNumberInputBase
        {...baseProps}
        phoneNumber="5551234567"
        onChangeParts={onChangeParts}
      />,
    );

    expect(onChangeParts).toHaveBeenCalledTimes(1);
    expect(onChangeParts).toHaveBeenCalledWith('5551234567', '');
  });

  // Regression test: both callers pass an inline arrow, so the callback
  // identity differs on every parent render. While `onChangeParts` was an effect
  // dependency the effect re-ran on every parent render and re-emitted the
  // current value; react-hook-form's `useWatch` in the parent then set state and
  // re-rendered, which produced a new arrow, and so on -- an infinite render
  // loop (~100 "Maximum update depth exceeded" warnings per load) on the
  // related-contact form.
  it('does not re-emit when the parent re-renders with a new callback identity', () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = render(
      <PhoneNumberInputBase
        {...baseProps}
        phoneNumber="5551234567"
        onChangeParts={first}
      />,
    );
    expect(first).toHaveBeenCalledTimes(1);

    rerender(
      <PhoneNumberInputBase
        {...baseProps}
        phoneNumber="5551234567"
        onChangeParts={second}
      />,
    );

    expect(second).not.toHaveBeenCalled();
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('still emits when the number changes', () => {
    const onChangeParts = vi.fn();

    const { getByPlaceholderText } = render(
      <PhoneNumberInputBase {...baseProps} onChangeParts={onChangeParts} />,
    );
    onChangeParts.mockClear();

    fireEvent.changeText(
      getByPlaceholderText('Enter phone number'),
      '5551234567',
    );

    expect(onChangeParts).toHaveBeenCalledWith('5551234567', '');
  });

  it('emits both parts', () => {
    const onChangeParts = vi.fn();

    const { getByPlaceholderText } = render(
      <PhoneNumberInputBase
        placeholderNumber="Enter phone number"
        placeholderExt="ext"
        onChangeParts={onChangeParts}
      />,
    );
    onChangeParts.mockClear();

    fireEvent.changeText(
      getByPlaceholderText('Enter phone number'),
      '5551234567',
    );
    fireEvent.changeText(getByPlaceholderText('ext'), '42');

    expect(onChangeParts).toHaveBeenLastCalledWith('5551234567', '42');
  });

  it('calls onClear when a populated number is cleared', () => {
    const onChangeParts = vi.fn();
    const onClear = vi.fn();

    const { getByPlaceholderText } = render(
      <PhoneNumberInputBase
        {...baseProps}
        phoneNumber="5551234567"
        onChangeParts={onChangeParts}
        onClear={onClear}
      />,
    );
    onChangeParts.mockClear();

    fireEvent.changeText(getByPlaceholderText('Enter phone number'), '');

    expect(onChangeParts).toHaveBeenCalledWith('', '');
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
