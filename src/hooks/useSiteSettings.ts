import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteSettingsApi } from "@/lib/api";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
} from "@/lib/site-settings";

export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  const settings = useMemo(
    () =>
      query.data
        ? normalizeSiteSettings(query.data)
        : DEFAULT_SITE_SETTINGS,
    [query.data],
  );

  return {
    ...query,
    settings,
  };
}
