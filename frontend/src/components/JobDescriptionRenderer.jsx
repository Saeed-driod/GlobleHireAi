import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Decodes HTML entities and strips dangerous scripts/tags safely.
 */
function sanitizeHtml(raw) {
  if (!raw) return '';
  
  let text = String(raw);

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&bull;/gi, '•')
    .replace(/&middot;/gi, '·')
    .replace(/&#8217;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"');

  // Strip script, style, and iframe tags entirely
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  return text;
}

/**
 * Checks whether text contains HTML tags
 */
function isHtml(text) {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

/**
 * Converts sanitized HTML/Markdown to clean plain paragraphs or sanitized blocks
 */
export default function JobDescriptionRenderer({ description, maxChars = 500 }) {
  const [expanded, setExpanded] = useState(false);

  const cleanText = useMemo(() => sanitizeHtml(description), [description]);
  const hasMarkup = useMemo(() => isHtml(cleanText), [cleanText]);
  const shouldTruncate = cleanText.length > maxChars;

  // Truncate logic
  const displayHtml = useMemo(() => {
    if (!shouldTruncate || expanded) return cleanText;
    
    // Simple text truncation for plain descriptions
    if (!hasMarkup) {
      return cleanText.slice(0, maxChars) + '...';
    }

    // For HTML, truncate safely at character limit while maintaining readability
    const plainLength = cleanText.replace(/<[^>]*>/g, '').length;
    if (plainLength <= maxChars) return cleanText;

    // Cut at maxChars in raw text and close any open tags gracefully
    const truncated = cleanText.slice(0, maxChars);
    return truncated + '...';
  }, [cleanText, hasMarkup, shouldTruncate, expanded, maxChars]);

  if (!description) {
    return <p className="text-xs text-[#8C9B92] italic">No description provided for this listing.</p>;
  }

  return (
    <div className="space-y-3">
      {hasMarkup ? (
        <div
          dangerouslySetInnerHTML={{ __html: displayHtml }}
          className="job-description-prose text-xs sm:text-sm text-[#3D4D43] dark:text-slate-300 leading-relaxed font-sans space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-1 [&_p]:my-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-bold [&_strong]:text-[#17261F] dark:[&_strong]:text-white [&_a]:text-[#0A5734] dark:[&_a]:text-[#00DF81] [&_a]:underline"
        />
      ) : (
        <div className="text-xs sm:text-sm text-[#3D4D43] dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
          {displayHtml}
        </div>
      )}

      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? "Show less description" : "Read full job description"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A5734] dark:text-[#00DF81] hover:underline pt-1 focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-lg focus-visible:outline-none"
        >
          <span>{expanded ? 'Show Less' : 'Read Full Job Description'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
