import { describe, expect, it, vi } from 'vitest';

import { reportTaskFailures } from './reportTaskFailures';

describe('reportTaskFailures', () => {
  it('shows the refused-task message as an error', () => {
    const showSnackbar = vi.fn();

    expect(reportTaskFailures('Task could not be created', showSnackbar)).toBe(
      true,
    );

    expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Task could not be created',
      type: 'error',
    });
  });

  it('stays quiet when there is no refusal', () => {
    const showSnackbar = vi.fn();

    expect(reportTaskFailures(undefined, showSnackbar)).toBe(false);
    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
