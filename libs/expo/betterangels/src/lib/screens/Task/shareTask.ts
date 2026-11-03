import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

/** A task as the share sheet needs it; the full query result satisfies this. */
export type ShareableTask = {
  id: string;
  summary?: string | null;
  /** True when the task is attached to a client, whose name the summary may carry. */
  hasClient?: boolean;
};

export type TaskShareOutcome = 'shared' | 'copied' | 'dismissed';

/**
 * The host that serves the web export and its app-link files.
 *
 * `app.config.js` sets this from the same `HOSTNAME` that drives the
 * `associatedDomains` entitlement and the Android intent filter, so the three
 * cannot disagree about which domain the app claims.
 */
export function outreachWebHost(): string {
  const host = Constants.expoConfig?.extra?.['outreachWebHost'] as
    | string
    | undefined;

  if (!host) {
    throw new Error('outreachWebHost is missing from app config');
  }

  return host.replace(/\/+$/, '');
}

/**
 * The deployment serving the current web page: the origin at the root, or
 * origin + `/branches/<branch>` on a preview. `null` outside the browser.
 */
function webShareBase(): string | null {
  if (
    Platform.OS !== 'web' ||
    typeof window === 'undefined' ||
    !window.location
  ) {
    return null;
  }

  const { origin, pathname } = window.location;
  // The share action lives on `/task/<id>`; everything before it is the base,
  // which is '' at the root and `/branches/<branch>` on a preview deploy.
  const route = '/task/';
  const index = pathname.lastIndexOf(route);

  return index === -1 ? origin : `${origin}${pathname.slice(0, index)}`;
}

export function taskShareUrl(taskId: string): string {
  const base = webShareBase() ?? `https://${outreachWebHost()}`;

  return `${base}/task/${encodeURIComponent(taskId)}`;
}

/**
 * A summary can name a client, so a client-attached task shares only its link.
 * Tasks without a client get the summary as context for the recipient.
 */
export function taskShareMessage(task: ShareableTask, url: string): string {
  const summary = task.summary?.trim();

  return task.hasClient || !summary ? url : `${summary} — ${url}`;
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
