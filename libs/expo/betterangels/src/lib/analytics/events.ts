import { ShelterSearchEvent } from '@monorepo/shared/shelter-handoff';

/**
 * This app's event names and properties.
 *
 * Nothing here may carry client data — no names, notes, dates of birth or client
 * ids. Events describe what a worker did, never who they did it for.
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
 * Two flags because they decide different things downstream: `handoff` means the
 * session id travelled, so step 2 shares this session; `handoff_person` means
 * the distinct id did, so the visit is at least the same person.
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
