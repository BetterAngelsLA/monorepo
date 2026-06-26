import { createContext, ReactNode, useContext } from 'react';
import { DEFAULT_SIDEBAR_CONTEXT_VALUE } from './constants';
import { SidebarContextValue, SidebarTheme, SidebarVariant } from './types';

function mergeSidebarTheme(
  base: SidebarContextValue,
  theme?: Partial<SidebarTheme>,
  variant?: SidebarVariant
): SidebarContextValue {
  return { ...base, ...theme, variant: variant ?? base.variant };
}

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

export function useSidebarTheme(): SidebarContextValue {
  return useContext(SidebarThemeContext);
}
