import type { AIExtractionOutput } from "./schemas";
import { SYSTEM_EXTRACTION_PROMPT, EXTRACTION_JSON_SCHEMA } from "./schemas";

export interface AIProvider {
  extractOpportunity(pageContent: string): Promise<AIExtractionOutput | null>;
  streamChat(messages: any[]): Promise<ReadableStream | string>;
}

// 70B model for high-quality extraction and matching (background tasks, latency-tolerant)
const AI_MODEL_EXTRACTION = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
// 8B fast model for interactive chat — must respond within Worker CPU time limits
const AI_MODEL_CHAT = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_CONTENT_CHARS = 8000;
// Chat responses can be detailed but must fit within Workers AI limits
const CHAT_MAX_TOKENS = 1024;

export class WorkersAIProvider implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly ai: any) {}

  async extractOpportunity(pageContent: string): Promise<AIExtractionOutput | null> {
    const truncated = pageContent.slice(0, MAX_CONTENT_CHARS);

    try {
      const response = await this.ai.run(
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

export function createAIProvider(ai: unknown): AIProvider {
  if (ai) {
    return new WorkersAIProvider(ai);
  }
  return new NullAIProvider();
}
