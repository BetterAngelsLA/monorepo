/**
 * Surface a task-apply failure without failing the note save itself.
 *
 * `applyTasks` runs after the note is already saved. Throwing here would send
 * the screen into its catch and invite a duplicate note on retry, so the note
 * save reports the refused tasks instead. Returns true when it showed a
 * message.
 */
export function reportTaskFailures(
  message: string | undefined,
  showSnackbar: (args: { message: string; type: 'error' }) => void,
): boolean {
  if (!message) return false;

  showSnackbar({ message, type: 'error' });

  return true;
}
