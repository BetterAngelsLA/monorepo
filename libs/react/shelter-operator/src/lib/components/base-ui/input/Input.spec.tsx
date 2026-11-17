import { render, screen } from '@testing-library/react';
import { Input } from './Input';

it('keeps an external description when it also shows an error', () => {
  render(
    <>
      <span id="next-day-note">Next day</span>
      <Input
        dataType="time"
        value="07:30"
        onChange={vi.fn()}
        aria-label="End time"
        aria-describedby="next-day-note"
        error="End time is required"
      />
    </>,
  );

  const describedBy =
    screen.getByLabelText('End time').getAttribute('aria-describedby') ?? '';
  const errorId = screen.getByText('End time is required').id;

  // Both the field's own helper text and the error message must be announced;
  // the error must not replace the helper.
  expect(describedBy.split(' ')).toStrictEqual(['next-day-note', errorId]);
});
