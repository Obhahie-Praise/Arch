import type { AIExtractionOutput } from "./schemas";
import { SYSTEM_EXTRACTION_PROMPT, EXTRACTION_JSON_SCHEMA } from "./schemas";
import { AIRouter } from "./router";
import type { AiUnavailableResult } from "./router";
import { DEFAULT_AI_FLAGS } from "./flags";
import type { AIFeatureFlags } from "./flags";

// Re-export so callers only need a single import point.
export type { AiUnavailableResult };
export { isAiUnavailable } from "./router";

export interface AIProvider {
  /**
   * Extract opportunity data from page content.
   *
   * Returns:
   * - `AIExtractionOutput` — AI ran successfully.
   * - `AiUnavailableResult` — AI is disabled or errored (router-level sentinel).
   *   Callers **must** handle this case explicitly; do not treat it as null.
   * - `null` — AI ran but determined the page is not an opportunity.
   */
  extractOpportunity(pageContent: string): Promise<AIExtractionOutput | AiUnavailableResult | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  streamChat(messages: any[]): Promise<ReadableStream | string>;
}

// 70B model for high-quality extraction and matching (background tasks, latency-tolerant)
const AI_MODEL_EXTRACTION = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
// 8B fast model for interactive chat — must respond within Worker CPU time limits
const AI_MODEL_CHAT = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_CONTENT_CHARS = 8000;
// Chat responses can be detailed but must fit within Workers AI limits
const CHAT_MAX_TOKENS = 1024;
// Maximum wall-clock time allowed for a single extraction call.
// Workers AI on the 70B model can stall indefinitely under load; this cap
// ensures the caller receives a fast rejection rather than hanging until the
// Worker CPU budget is exhausted, which would kill the entire pipeline run.
const AI_EXTRACTION_TIMEOUT_MS = 20_000;

/**
 * Races `promise` against a timer. Throws with a descriptive message on timeout
 * so callers can distinguish a timeout from other AI errors.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`AI call timed out after ${ms}ms (${label})`)),
      ms
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export class WorkersAIProvider implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly ai: any) {}

  async extractOpportunity(pageContent: string): Promise<AIExtractionOutput | null> {
    const truncated = pageContent.slice(0, MAX_CONTENT_CHARS);

    const aiCall = this.ai.run(
      AI_MODEL_EXTRACTION,
      {
        messages: [
          { role: "system", content: SYSTEM_EXTRACTION_PROMPT },
          {
            role: "user",
            content: `Extract the opportunity information from this webpage content:\n\n${truncated}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "opportunity_extraction",
            strict: true,
            schema: EXTRACTION_JSON_SCHEMA,
          },
        },
      }
    );

    // Let the timeout error propagate to the caller so it can record it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await withTimeout<any>(aiCall, AI_EXTRACTION_TIMEOUT_MS, "extractOpportunity");

    const raw = typeof response === "string" ? response : response?.response ?? "";
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AIExtractionOutput;
    return parsed;
  }

  async streamChat(messages: any[]): Promise<ReadableStream | string> {
    try {
      const response = await this.ai.run(AI_MODEL_CHAT, {
        messages,
        max_tokens: CHAT_MAX_TOKENS,
      });

      // Log the raw response shape so failures can be diagnosed in wrangler logs
      console.log("[streamChat] raw response type:", typeof response);
      if (response && typeof response === "object") {
        console.log("[streamChat] response keys:", Object.keys(response));
      }

      // Workers AI non-streaming returns { response: string, usage: {...} }
      const text: string =
        typeof response === "string"
          ? response
          : typeof response?.response === "string"
          ? response.response
          : "";

      if (!text) {
        console.error("[streamChat] AI returned empty or unrecognised response shape:", JSON.stringify(response));
        return "I wasn't able to generate a response. Please try again.";
      }

      return text;
    } catch (err) {
      console.error("[streamChat] Workers AI call failed:", err);
      return "I encountered an error while generating a response. Please try again.";
    }
  }
}

/**
 * Null AI provider — used when AI binding is not configured.
 */
export class NullAIProvider implements AIProvider {
  async extractOpportunity(_pageContent: string): Promise<AIExtractionOutput | null> {
    return null;
  }

  async streamChat(_messages: any[]): Promise<ReadableStream | string> {
    return "AI chat is currently unavailable.";
  }
}

/**
 * Factory used by the pipeline and refresh worker.
 *
 * Always returns an `AIRouter`-wrapped instance so the fail-closed guarantee
 * and feature flags apply uniformly across all call sites.
 * The inner provider (Workers AI or Null) is selected based on the binding.
 *
 * @param ai      - The Workers AI binding from the Worker env, or undefined/null.
 * @param flags   - Optional partial flag overrides (defaults to DEFAULT_AI_FLAGS).
 */
export function createAIProvider(
  ai: unknown,
  flags: Partial<AIFeatureFlags> = DEFAULT_AI_FLAGS
): AIProvider {
  const inner = ai ? new WorkersAIProvider(ai) : new NullAIProvider();
  return new AIRouter(inner, flags);
}
