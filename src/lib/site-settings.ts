export const SITE_SETTINGS_STORAGE_KEY = "nb_admin_settings";

export type SiteSettings = {
  siteName: string;
  logoUrl: string;
  highlightPresent: string;
  highlightAbsent: string;
  highlightInactive: string;
  sloganText: string;
  sloganFontFamily: string;
  sloganFontWeight: "light" | "regular" | "bold";
  sloganDesktopSize: number;
  sloganMobileSize: number;
  sloganColor: string;
  sloganAlign: "left" | "center" | "right";
  sloganLineHeight: number;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "NextBand",
  logoUrl: "",
  highlightPresent: "#fff7a5",
  highlightAbsent: "#ffd7d7",
  highlightInactive: "#e5e7eb",
  sloganText: "Khám phá khóa học IELTS",
  sloganFontFamily: "'Be Vietnam Pro', sans-serif",
  sloganFontWeight: "bold",
  sloganDesktopSize: 56,
  sloganMobileSize: 34,
  sloganColor: "#0f172a",
  sloganAlign: "left",
  sloganLineHeight: 1.2,
};

export function loadSiteSettings(): SiteSettings {
  const raw = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
  if (!raw) return DEFAULT_SITE_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SITE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveSiteSettings(next: SiteSettings) {
  localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(next));
}
