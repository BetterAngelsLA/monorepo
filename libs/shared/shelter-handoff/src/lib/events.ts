/**
 * The funnel, named once: `opened` from the app, `landed` from the shelter site,
 * `failed` when the browser refuses. A funnel joins them by name, so renaming one
 * side breaks nothing that compiles — it just stops counting.
 */
export const ShelterSearchEvent = {
  Opened: 'shelter_search_opened',
  Failed: 'shelter_search_failed',
  Landed: 'shelter_search_landed',
} as const;
