import type { SidebarContextValue, SidebarTheme } from './types';

export const DEFAULT_SIDEBAR_THEME: SidebarTheme = {
  fontColor: 'currentColor',
  activeColor: 'currentColor',
  bgHover: 'var(--color-neutral-98)',
  bgActive: 'var(--color-neutral-98)',
};

export const DEFAULT_SIDEBAR_CONTEXT_VALUE: SidebarContextValue = {
  ...DEFAULT_SIDEBAR_THEME,
  variant: 'decorated',
};
