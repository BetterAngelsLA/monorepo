import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

export type ShareableTask = {
  id: string;
};

export type TaskShareOutcome = 'shared' | 'copied' | 'dismissed';

/**
 * The host that serves the web export and its app-link files.
 *
 * Read from the same `EXPO_PUBLIC_OUTREACH_HOST` that `app.config.js` used for
 * the entitlement and intent filter; Expo inlines the value into the bundle at
 * build time, so the two cannot disagree about which domain the app claims.
 */
function outreachWebHost(): string {
  const host = process.env.EXPO_PUBLIC_OUTREACH_HOST?.trim();

  if (!host) {
    throw new Error('EXPO_PUBLIC_OUTREACH_HOST is not set');
  }

  return host.replace(/\/+$/, '');
}

const TASK_ROUTE = '/task/';
const OWN_DOMAIN = 'betterangels.la';

/**
 * The deployment serving the current web page: the origin at the root, or
 * origin + `/branches/<branch>` on a preview. `null` outside the browser or
 * when the page is served from someone else's host.
 */
function webShareBase(configuredHost: string): string | null {
  if (
    Platform.OS !== 'web' ||
    typeof window === 'undefined' ||
    !window.location
  ) {
    return null;
  }

  const { origin, host, pathname } = window.location;
  const isOwnDomain = host === OWN_DOMAIN || host.endsWith(`.${OWN_DOMAIN}`);

  if (host !== configuredHost && !isOwnDomain) {
    return null;
  }

  // Strip the trailing `/task/<id>`; what remains is the deployment base, ''
  // at the root and `/branches/<branch>` on a preview.
  const basePath = pathname.replace(new RegExp(`${TASK_ROUTE}[^/]+/?$`), '');

  return basePath === pathname ? origin : `${origin}${basePath}`;
}

export function taskShareUrl(taskId: string): string {
  const host = outreachWebHost();
  const base = webShareBase(host) ?? `https://${host}`;

  return `${base}${TASK_ROUTE}${encodeURIComponent(taskId)}`;
}

/**
 * Only the link is shared: a summary can name a client, and this action has no
 * per-task permission check. The task page itself still requires sign-in and
 * access. `anchor` is the iPad popover source (iOS only).
 */
export async function shareTask(
  task: ShareableTask,
  anchor?: number,
): Promise<TaskShareOutcome> {
  const url = taskShareUrl(task.id);

  try {
    const result = await Share.share(
      { title: 'Task', message: url },
      { dialogTitle: 'Share task', subject: 'Task', anchor },
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
