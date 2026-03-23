/**
 * RichContent - Consistent renderer for HTML from the rich text editor.
 *
 * Handles both HTML content (from TipTap/rich editor with <p> tags) and
 * plain text content (with raw \n newlines), preserving paragraph structure
 * in both cases.
 */

interface RichContentProps {
  html: string;
  /** Extra Tailwind/CSS classes */
  className?: string;
  /**
   * Use "passage" variant for reading passages – larger inter-paragraph gap
   * matching IELTS exam style.
   */
  variant?: "default" | "passage";
}

const HTML_TAG_RE = /<[a-z][\s\S]*>/i;

export function RichContent({ html, className = "", variant = "default" }: RichContentProps) {
  if (!html) return null;

  const variantClass = variant === "passage" ? "rich-content-passage" : "";

  // If the content contains HTML tags, render as HTML (dangerouslySetInnerHTML).
  if (HTML_TAG_RE.test(html)) {
    return (
      <div
        className={`rich-content ${variantClass} ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Plain text: split by one or more blank lines to get paragraphs,
  // then render each as a <p> so spacing is consistent with HTML mode.
  const paragraphs = html
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    // Single paragraph – preserve inner line breaks
    return (
      <div className={`rich-content ${variantClass} ${className}`.trim()}>
        <p style={{ whiteSpace: "pre-wrap" }}>{html}</p>
      </div>
    );
  }

  return (
    <div className={`rich-content ${variantClass} ${className}`.trim()}>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ whiteSpace: "pre-wrap" }}>
          {para}
        </p>
      ))}
    </div>
  );
}
