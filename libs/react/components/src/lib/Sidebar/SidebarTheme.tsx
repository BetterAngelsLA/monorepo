import { createContext, ReactNode, useContext } from 'react';

// ─── Variant ────────────────────────────────────────────────────────────────

export type SidebarVariant = 'basic' | 'decorated';

// ─── Theme shape ────────────────────────────────────────────────────────────

export interface SidebarTheme {
  /** Visual variant: 'basic' hides marker + active background, 'decorated' shows them */
  variant: SidebarVariant;
  /** Font color for inactive items */
  fontColor: string;
  /** Base color for active/selected state. fontColorActive and markerColor fall back to this. */
  activeColor: string;
  /** Font color for active/selected items. Falls back to activeColor if not set. */
  fontColorActive?: string;
  /** Background color on hover */
  bgHover: string;
  /** Background color when active/selected */
  bgActive: string;
  /** Color of the right-edge selected marker. Falls back to activeColor if not set. */
  markerColor?: string;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_SIDEBAR_THEME: SidebarTheme = {
  variant: 'decorated',
  fontColor: 'currentColor',
  activeColor: 'currentColor',
  bgHover: 'var(--color-neutral-98)',
  bgActive: 'var(--color-neutral-98)',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function mergeSidebarTheme(
  base: SidebarTheme,
  overrides?: Partial<SidebarTheme>
): SidebarTheme {
  return { ...base, ...overrides };
}

// ─── Context ────────────────────────────────────────────────────────────────

const SidebarThemeContext = createContext<SidebarTheme>(DEFAULT_SIDEBAR_THEME);

export function SidebarThemeProvider({
  theme,
  children,
}: {
  theme?: Partial<SidebarTheme>;
  children: ReactNode;
}) {
  const parent = useContext(SidebarThemeContext);

  return (
    <SidebarThemeContext.Provider value={mergeSidebarTheme(parent, theme)}>
      {children}
    </SidebarThemeContext.Provider>
  );
}

/** Hook to read the current sidebar theme */
export function useSidebarTheme(): SidebarTheme {
  return useContext(SidebarThemeContext);
}
