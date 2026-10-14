import { TUploadItem, TUploadSession } from './uploadProgressTypes';

/** 0-100 progress percentage for an in-flight item, or null when unknown. */
export function uploadProgressPct(item: TUploadItem): number | null {
  if (
    item.status !== 'uploading' ||
    typeof item.totalBytes !== 'number' ||
    item.totalBytes <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.round(((item.bytesSent ?? 0) / item.totalBytes) * 100),
  );
}

export type TUploadSessionCounts = {
  total: number;
  /** Files whose bytes reached S3, saved or not (the progress numerator). */
  completed: number;
  failed: boolean;
  /** Every file persisted. The cleanup prunes sessions once this is true. */
  complete: boolean;
};

/**
 * Progress counts for a session, derived from its items. This is the single
 * source of truth: nothing stores these numbers, so cancelling or retrying
 * an item cannot leave them stale.
 */
export function uploadSessionCounts(
  session: TUploadSession,
): TUploadSessionCounts {
  const { items } = session;

  return {
    total: items.length,
    completed: items.filter(
      (item) => item.status === 'uploaded' || item.status === 'done',
    ).length,
    failed: items.some((item) => item.status === 'error'),
    complete: items.length > 0 && items.every((item) => item.status === 'done'),
  };
}

/** Aggregate item counts across in-flight sessions (for the global bar). */
export function aggregateUploadCounts(sessions: TUploadSession[]): {
  totalItems: number;
  completedItems: number;
  failed: boolean;
} {
  const initial = { totalItems: 0, completedItems: 0, failed: false };

  return sessions.reduce((acc, session) => {
    const counts = uploadSessionCounts(session);

    return {
      totalItems: acc.totalItems + counts.total,
      completedItems: acc.completedItems + counts.completed,
      failed: acc.failed || counts.failed,
    };
  }, initial);
}
