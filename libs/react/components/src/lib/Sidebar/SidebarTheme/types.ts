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

export interface SidebarContextValue extends SidebarTheme {
  variant: SidebarVariant;
}
