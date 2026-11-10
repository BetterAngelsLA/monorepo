/**
 * The funnel, named once.
 *
 * `opened` is sent by the outreach app, `landed` by the shelter site, and
 * `failed` by the app when the browser refuses to open. A funnel joins them by
 * name, so renaming one side does not break a build, an import or a test — it
 * just stops counting, which is the failure mode hardest to notice.
 */
export const ShelterSearchEvent = {
  Opened: 'shelter_search_opened',
  Failed: 'shelter_search_failed',
  Landed: 'shelter_search_landed',
} as const;

export type ShelterSearchEventName =
  (typeof ShelterSearchEvent)[keyof typeof ShelterSearchEvent];
