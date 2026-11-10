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
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export const ShelterSearchSource = {
  ClientProfile: 'client_profile',
} as const;

export type ShelterSearchSource =
  (typeof ShelterSearchSource)[keyof typeof ShelterSearchSource];

export type AnalyticsEventProperties = {
  [AnalyticsEvent.ShelterSearchOpened]: {
    source: ShelterSearchSource;
    /** True when the shelter URL carried this session's PostHog identity. */
    handoff: boolean;
  };
};
