import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

/** A task as the share sheet needs it; the full query result satisfies this. */
export type ShareableTask = {
  id: string;
  summary?: string | null;
  clientProfile?: { id: string } | null;
  hmisClientProfile?: { id: string } | null;
};

export type TaskShareOutcome = 'shared' | 'copied' | 'dismissed';

/**
 * The host that serves the web export and its app-link files.
 *
 * Set per profile in `eas.json`; the `APP_ENV` fallback keeps a local
 * `expo start` working when `.env` has not been regenerated.
 */
export function outreachWebUrl(): string {
  const configured = process.env['EXPO_PUBLIC_OUTREACH_WEB_URL']?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  return process.env['EXPO_PUBLIC_APP_ENV'] === 'production'
    ? 'https://outreach.betterangels.la'
    : 'https://outreach.dev.betterangels.la';
}

export function taskShareUrl(taskId: string): string {
  return `${outreachWebUrl()}/task/${encodeURIComponent(taskId)}`;
}

/**
 * A summary can name a client, so a client-attached task shares only its link.
 * Tasks without a client get the summary as context for the recipient.
 */
export function taskShareMessage(task: ShareableTask, url: string): string {
  const summary = task.summary?.trim();
  const hasClient = !!(task.clientProfile || task.hmisClientProfile);

  return hasClient || !summary ? url : `${summary} — ${url}`;
}

export async function shareTask(
  task: ShareableTask,
): Promise<TaskShareOutcome> {
  const url = taskShareUrl(task.id);
  const title = task.summary?.trim() || 'Task';

  try {
    const result = await Share.share(
      { title, message: taskShareMessage(task, url) },
      { dialogTitle: 'Share task', subject: title },
    );

    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch (error) {
    // On web this forwards to navigator.share. A dismissal rejects with
    // AbortError — a user decision, not a failure — and anything else (no Web
    // Share API, blocked) falls back to copying the link.
    if (Platform.OS === 'web') {
      if ((error as { name?: string } | null)?.name === 'AbortError') {
        return 'dismissed';
      }

      await Clipboard.setStringAsync(url);
      return 'copied';
    }

    throw error;
  }
}
