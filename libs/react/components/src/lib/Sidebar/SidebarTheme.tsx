import { createContext, ReactNode, useContext } from 'react';

// ─── Variant ────────────────────────────────────────────────────────────────

export type SidebarVariant = 'basic' | 'decorated';

// ─── Theme shape ────────────────────────────────────────────────────────────

export interface SidebarTheme {
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

// ─── Internal context type (adds variant that Sidebar injects) ──────────────

interface SidebarContextValue extends SidebarTheme {
  variant: SidebarVariant;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_SIDEBAR_THEME: SidebarTheme = {
  fontColor: 'currentColor',
  activeColor: 'currentColor',
  bgHover: 'var(--color-neutral-98)',
  bgActive: 'var(--color-neutral-98)',
};

const DEFAULT_SIDEBAR_CONTEXT_VALUE: SidebarContextValue = {
  ...DEFAULT_SIDEBAR_THEME,
  variant: 'decorated',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function mergeSidebarTheme(
  base: SidebarContextValue,
  theme?: Partial<SidebarTheme>,
  variant?: SidebarVariant
): SidebarContextValue {
  return { ...base, ...theme, variant: variant ?? base.variant };
}

// ─── Context ────────────────────────────────────────────────────────────────

const SidebarThemeContext = createContext<SidebarContextValue>(
  DEFAULT_SIDEBAR_CONTEXT_VALUE
);

export function SidebarThemeProvider({
  theme,
  variant,
  children,
}: {
  theme?: Partial<SidebarTheme>;
  variant: SidebarVariant;
  children: ReactNode;
}) {
  const parent = useContext(SidebarThemeContext);

  return (
    <SidebarThemeContext.Provider
      value={mergeSidebarTheme(parent, theme, variant)}
    >
      {children}
    </SidebarThemeContext.Provider>
  );
}

/** Hook to read the current sidebar theme */
export function useSidebarTheme(): SidebarContextValue {
  return useContext(SidebarThemeContext);
}
