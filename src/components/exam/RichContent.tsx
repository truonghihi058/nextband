/**
 * RichContent - Consistent renderer for HTML from the rich text editor.
 * Applies the .rich-content CSS class for WYSIWYG style consistency.
 */

interface RichContentProps {
  html: string;
  className?: string;
}

export function RichContent({ html, className = "" }: RichContentProps) {
  if (!html) return null;
  return (
    <div
      className={`rich-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
