import { normalizeUrl } from "./normalizer";

export interface FetchResult {
  success: boolean;
  url: string;
  canonicalUrl?: string;
  statusCode?: number;
  contentType?: string;
  html?: string;
  text?: string;
  error?: string;
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
const FETCH_TIMEOUT_MS = 10000; // 10s timeout

/**
 * Checks if a URL is safe to fetch (SSRF Protection).
 */
export function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, internal hostnames, and IP ranges
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    // Check private IPv4 patterns
    const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
    if (ipv4Match) {
      const p1 = parseInt(ipv4Match[1], 10);
      const p2 = parseInt(ipv4Match[2], 10);
      if (p1 === 10) return false; // 10.0.0.0/8
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false; // 172.16.0.0/12
      if (p1 === 192 && p2 === 168) return false; // 192.168.0.0/16
      if (p1 === 127) return false; // 127.0.0.0/8
      if (p1 === 169 && p2 === 254) return false; // Link local 169.254.0.0/16
    }

    return true;
  } catch {
    return false;
  }
}

export class PageFetcher {
  static async fetchPage(targetUrl: string): Promise<FetchResult> {
    const normUrl = normalizeUrl(targetUrl);
    if (!isSafeUrl(normUrl)) {
      return {
        success: false,
        url: targetUrl,
        error: "URL rejected by SSRF protection filter",
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(normUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ArchOpportunityBot/1.0 (+https://arch.inc)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          url: normUrl,
          statusCode: response.status,
          error: `HTTP status ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const finalUrl = response.url || normUrl;

      // Check size header if available
      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_RESPONSE_BYTES) {
        return {
          success: false,
          url: finalUrl,
          statusCode: response.status,
          error: `Response size exceeds limit of ${MAX_RESPONSE_BYTES} bytes`,
        };
      }

      const rawText = await response.text();
      if (rawText.length > MAX_RESPONSE_BYTES) {
        return {
          success: false,
          url: finalUrl,
          statusCode: response.status,
          error: `Response text size ${rawText.length} exceeds limit`,
        };
      }

      return {
        success: true,
        url: normUrl,
        canonicalUrl: finalUrl !== normUrl ? finalUrl : undefined,
        statusCode: response.status,
        contentType,
        html: rawText,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        success: false,
        url: normUrl,
        error: isAbort ? "Fetch request timed out after 10s" : err instanceof Error ? err.message : String(err),
      };
    }
  }
}
