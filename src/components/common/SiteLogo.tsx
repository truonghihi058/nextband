import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface SiteLogoProps {
  className?: string;
  alt?: string;
  fallbackSrc?: string;
}

const getFullLogoUrl = (url: string) => {
  if (url.startsWith("/uploads")) {
    const apiUrl =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
    const baseUrl = apiUrl.replace("/api/v1", "");
    return `${baseUrl}${url}`;
  }
  return url;
};

export function SiteLogo({
  className,
  alt,
  fallbackSrc = "/logo.png",
}: SiteLogoProps) {
  const { settings } = useSiteSettings();
  const [hasLoadError, setHasLoadError] = useState(false);

  const logoSrc =
    !hasLoadError && settings.logoUrl
      ? getFullLogoUrl(settings.logoUrl)
      : fallbackSrc;

  return (
    <img
      src={logoSrc}
      alt={alt || `${settings.siteName} Logo`}
      className={cn("object-contain", className)}
      onError={() => setHasLoadError(true)}
    />
  );
}
