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
  ClientPicker: 'client_picker',
} as const;

export type ShelterSearchSource =
  (typeof ShelterSearchSource)[keyof typeof ShelterSearchSource];

/**
 * Whether a person and their session left with the link.
 *
 * One flag, not two: the app only hands over a session id together with a
 * distinct id, because shelter-web drops a session-only handoff. The receiver
 * still reports `handoff`/`handoff_person` separately, since a URL from any
 * client can carry either.
 */
export type AnalyticsEventProperties = {
  [AnalyticsEvent.ShelterSearchOpened]: {
    source: ShelterSearchSource;
    handoff: boolean;
  };
  /** The browser refused to open, so no landing event should be expected. */
  [AnalyticsEvent.ShelterSearchFailed]: {
    source: ShelterSearchSource;
  };
};
