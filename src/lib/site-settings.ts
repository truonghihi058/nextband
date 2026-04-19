export type SiteSettings = {
  siteName: string;
  logoUrl: string;
  authTagline: string;
  authFeatureOneTitle: string;
  authFeatureOneDescription: string;
  authFeatureTwoTitle: string;
  authFeatureTwoDescription: string;
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
  heroDescriptionText: string;
  heroDescriptionFontFamily: string;
  heroDescriptionFontWeight: "light" | "regular" | "bold";
  heroDescriptionDesktopSize: number;
  heroDescriptionMobileSize: number;
  heroDescriptionColor: string;
  heroDescriptionAlign: "left" | "center" | "right";
  heroDescriptionLineHeight: number;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "NextBand",
  logoUrl: "",
  authTagline: "Nền tảng học IELTS hiện đại",
  authFeatureOneTitle: "Khóa học chất lượng",
  authFeatureOneDescription: "Hàng trăm bài học từ cơ bản đến nâng cao",
  authFeatureTwoTitle: "Giáo viên uy tín",
  authFeatureTwoDescription: "Đội ngũ giáo viên giàu kinh nghiệm",
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
  heroDescriptionText:
    "Nâng cao kỹ năng tiếng Anh của bạn với các khóa học được thiết kế bởi đội ngũ giáo viên giàu kinh nghiệm.",
  heroDescriptionFontFamily: "'Be Vietnam Pro', sans-serif",
  heroDescriptionFontWeight: "regular",
  heroDescriptionDesktopSize: 30,
  heroDescriptionMobileSize: 20,
  heroDescriptionColor: "#64748b",
  heroDescriptionAlign: "left",
  heroDescriptionLineHeight: 1.6,
};

export function normalizeSiteSettings(raw: any): SiteSettings {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...raw,
    logoUrl: raw?.logoUrl || "",
    authTagline: raw?.authTagline ?? DEFAULT_SITE_SETTINGS.authTagline,
    authFeatureOneTitle:
      raw?.authFeatureOneTitle ?? DEFAULT_SITE_SETTINGS.authFeatureOneTitle,
    authFeatureOneDescription:
      raw?.authFeatureOneDescription ??
      DEFAULT_SITE_SETTINGS.authFeatureOneDescription,
    authFeatureTwoTitle:
      raw?.authFeatureTwoTitle ?? DEFAULT_SITE_SETTINGS.authFeatureTwoTitle,
    authFeatureTwoDescription:
      raw?.authFeatureTwoDescription ??
      DEFAULT_SITE_SETTINGS.authFeatureTwoDescription,
    sloganFontWeight: ["light", "regular", "bold"].includes(
      raw?.sloganFontWeight,
    )
      ? raw.sloganFontWeight
      : DEFAULT_SITE_SETTINGS.sloganFontWeight,
    sloganAlign: ["left", "center", "right"].includes(raw?.sloganAlign)
      ? raw.sloganAlign
      : DEFAULT_SITE_SETTINGS.sloganAlign,
    heroDescriptionFontWeight: ["light", "regular", "bold"].includes(
      raw?.heroDescriptionFontWeight,
    )
      ? raw.heroDescriptionFontWeight
      : DEFAULT_SITE_SETTINGS.heroDescriptionFontWeight,
    heroDescriptionAlign: ["left", "center", "right"].includes(
      raw?.heroDescriptionAlign,
    )
      ? raw.heroDescriptionAlign
      : DEFAULT_SITE_SETTINGS.heroDescriptionAlign,
    sloganLineHeight:
      typeof raw?.sloganLineHeight === "number"
        ? raw.sloganLineHeight
        : Number(raw?.sloganLineHeight ?? DEFAULT_SITE_SETTINGS.sloganLineHeight),
    heroDescriptionLineHeight:
      typeof raw?.heroDescriptionLineHeight === "number"
        ? raw.heroDescriptionLineHeight
        : Number(
            raw?.heroDescriptionLineHeight ??
              DEFAULT_SITE_SETTINGS.heroDescriptionLineHeight,
          ),
  };
}
