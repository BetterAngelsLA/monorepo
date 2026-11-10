/**
 * Event names and their properties.
 *
 * Two rules for everything in this file:
 *
 * 1. No client data. Events describe what a user did, never who they did it
 *    for — no names, notes, dates of birth, or client ids.
 * 2. `shelter_search_opened` and `shelter_search_landed` are a pair. The first
 *    is sent by this app, the second by shelter-web, and a funnel across both
 *    is the whole point of the handoff in `shelterHandoff.ts`. Renaming one
 *    breaks the funnel silently, so they live side by side here.
 */
export const AnalyticsEvent = {
  ShelterSearchOpened: 'shelter_search_opened',
  ShelterSearchFailed: 'shelter_search_failed',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export const ShelterSearchSource = {
  ClientProfile: 'client_profile',
} as const;

export type ShelterSearchSource =
  (typeof ShelterSearchSource)[keyof typeof ShelterSearchSource];

/**
 * The two handoff flags are separate because they mean different things on the
 * receiving side, and only one of them decides whether the funnel's two steps
 * share a session:
 *
 * - `handoff` — the session id travelled, so shelter-web continues *this*
 *   session. False means step 2 will be a new session, even though the same
 *   person may have arrived.
 * - `handoff_person` — the distinct id travelled, so the visit is attributed to
 *   the same person either way.
 */
export type ShelterSearchHandoffProperties = {
  handoff: boolean;
  handoff_person: boolean;
};

export type AnalyticsEventProperties = {
  [AnalyticsEvent.ShelterSearchOpened]: {
    source: ShelterSearchSource;
  } & ShelterSearchHandoffProperties;
  /** The browser refused to open, so no landing event should be expected. */
  [AnalyticsEvent.ShelterSearchFailed]: {
    source: ShelterSearchSource;
  };
};
