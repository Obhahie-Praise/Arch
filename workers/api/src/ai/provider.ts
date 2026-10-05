import type { AIExtractionOutput } from "./schemas";
import { SYSTEM_EXTRACTION_PROMPT, EXTRACTION_JSON_SCHEMA } from "./schemas";

export interface AIProvider {
  extractOpportunity(pageContent: string): Promise<AIExtractionOutput | null>;
  streamChat(messages: any[]): Promise<ReadableStream | string>;
}

const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_CONTENT_CHARS = 8000;

export class WorkersAIProvider implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly ai: any) {}

  async extractOpportunity(pageContent: string): Promise<AIExtractionOutput | null> {
    const truncated = pageContent.slice(0, MAX_CONTENT_CHARS);

    try {
      const response = await this.ai.run(
        AI_MODEL,
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

      const raw = typeof response === "string" ? response : response?.response ?? "";
      if (!raw) return null;

      const parsed = JSON.parse(raw) as AIExtractionOutput;
      return parsed;
    } catch {
      return null;
    }
  }

  async streamChat(messages: any[]): Promise<ReadableStream | string> {
    try {
      // Use non-streaming mode. Cloudflare Workers AI streaming returns SSE which
      // is difficult to relay correctly through Hono without wrapping/unwrapping
      // mismatches on both ends. A plain JSON response is simpler and reliable.
      const response = await this.ai.run(AI_MODEL, { messages });
      const text: string =
        typeof response === "string"
          ? response
          : (response?.response ?? "");
      if (!text) {
        console.error("[streamChat] AI returned empty response", { model: AI_MODEL });
        return "I'm sorry, I wasn't able to generate a response. Please try again.";
      }
      return text;
    } catch (err) {
      console.error("[streamChat] AI call failed:", err);
      return "I'm sorry, I encountered an error while generating a response. Please try again.";
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

export function createAIProvider(ai: unknown): AIProvider {
  if (ai) {
    return new WorkersAIProvider(ai);
  }
  return new NullAIProvider();
}
