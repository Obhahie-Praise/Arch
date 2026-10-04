import type { ExtractedOpportunityContent } from "./types";
import type { FetchResult } from "./fetcher";

export class ContentExtractor {
  /**
   * Converts a FetchResult containing raw HTML into ExtractedOpportunityContent.
   */
  static extractContent(fetchRes: FetchResult): ExtractedOpportunityContent {
    const html = fetchRes.html || "";
    const metadata: Record<string, string> = {};

    // 1. Extract metadata from <meta> tags
    const metaMatches = html.matchAll(/<meta\s+[^>]*?(?:name|property|itemprop)=["']([^"']+)["']\s+[^>]*?content=["']([^"']+)["']/gi);
    for (const match of metaMatches) {
      const key = match[1].toLowerCase();
      const val = match[2].trim();
      metadata[key] = val;
    }

    // Secondary meta regex format (content before name/property)
    const metaMatchesAlt = html.matchAll(/<meta\s+[^>]*?content=["']([^"']+)["']\s+[^>]*?(?:name|property|itemprop)=["']([^"']+)["']/gi);
    for (const match of metaMatchesAlt) {
      const key = match[2].toLowerCase();
      const val = match[1].trim();
      if (!metadata[key]) metadata[key] = val;
    }

    // 2. Extract page title
    let title = metadata["og:title"] || metadata["twitter:title"] || metadata["title"];
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].replace(/\s+/g, " ").trim();
      }
    }

    // 3. Extract description
    const description =
      metadata["og:description"] ||
      metadata["twitter:description"] ||
      metadata["description"];

    // 4. Extract canonical link
    let canonicalUrl = fetchRes.canonicalUrl;
    if (!canonicalUrl) {
      const canonicalMatch = html.match(/<link\s+[^>]*?rel=["']canonical["']\s+[^>]*?href=["']([^"']+)["']/i);
      if (canonicalMatch) {
        canonicalUrl = canonicalMatch[1].trim();
      }
    }

    // 5. Clean HTML body to extract main text content
    let cleanText = html;
    // Remove scripts, styles, noscript, svg, header, nav, footer
    cleanText = cleanText.replace(/<script[\s\S]*?<\/script>/gi, " ");
    cleanText = cleanText.replace(/<style[\s\S]*?<\/style>/gi, " ");
    cleanText = cleanText.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
    cleanText = cleanText.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
    cleanText = cleanText.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
    cleanText = cleanText.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
    cleanText = cleanText.replace(/<!--[\s\S]*?-->/g, " ");

    // Replace block tags with newline breaks
    cleanText = cleanText.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, "\n");
    cleanText = cleanText.replace(/<br\s*\/?>/gi, "\n");

    // Strip remaining HTML tags
    cleanText = cleanText.replace(/<[^>]+>/g, " ");

    // Decode HTML entities
    cleanText = cleanText
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");

    // Normalize multiple spaces and newlines
    cleanText = cleanText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    return {
      url: fetchRes.url,
      canonicalUrl,
      title: title ? title.replace(/\s+/g, " ").trim() : undefined,
      description: description ? description.replace(/\s+/g, " ").trim() : undefined,
      text: cleanText.slice(0, 25000), // Cap max text length for efficiency
      metadata,
    };
  }
}
