import { ShelterSearchEvent } from '@monorepo/shared/shelter-handoff';

/**
 * Event names and their properties for this app.
 *
 * `shelter_search_opened` and `shelter_search_landed` are a pair: the first is
 * sent here, the second by shelter-web, and the funnel across both is the whole
 * point of the handoff. The names live in `@monorepo/shared/shelter-handoff` so the
 * two apps cannot disagree about them.
 *
 * Everything in this file must be free of client data — no names, notes, dates
 * of birth, or client ids. Events describe what a worker did, never who they
 * did it for.
 */
export const AnalyticsEvent = {
  ShelterSearchOpened: ShelterSearchEvent.Opened,
  ShelterSearchFailed: ShelterSearchEvent.Failed,
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
