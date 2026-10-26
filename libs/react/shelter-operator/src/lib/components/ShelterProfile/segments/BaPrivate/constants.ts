export const BA_PRIVATE_TABS = ['contacts', 'review'] as const;

export type BaPrivateTab = (typeof BA_PRIVATE_TABS)[number];

export const BA_PRIVATE_TAB_LABELS: Record<BaPrivateTab, string> = {
  contacts: 'Contacts',
  review: 'Review',
};
