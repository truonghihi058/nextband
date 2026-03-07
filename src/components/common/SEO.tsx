import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export function SEO({ title, description, keywords }: SEOProps) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | NextBand`;
    }

    if (description) {
      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }
    }

    if (keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute("content", keywords);
      }
    }
  }, [title, description, keywords]);

  return null;
}
