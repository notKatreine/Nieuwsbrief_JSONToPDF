import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { ParseError, categoriesOf, parseItems } from "@/lib/newsletter/parse";

export default defineTool({
  name: "validate_items",
  title: "Validate newsletter items",
  description:
    "Validate a JSON array of newsletter items (Dutch or English field names) and report item count, categories and any parse errors.",
  inputSchema: {
    json: z
      .string()
      .min(1)
      .describe("Raw JSON text containing an array of newsletter items."),
    language: z.enum(["nl", "en"]).default("nl").describe("Language of the item list."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ json, language }) => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(json);
    } catch (error) {
      return {
        content: [{ type: "text", text: `Invalid JSON: ${(error as Error).message}` }],
        isError: true,
      };
    }

    try {
      const items = parseItems(parsedJson, language);
      const categories = categoriesOf(items);
      const perCategory = categories.map((category) => ({
        category,
        count: items.filter((item) => item.category === category).length,
      }));
      const missingUrl = items.filter((item) => !item.url).length;

      return {
        content: [
          {
            type: "text",
            text: `Valid: ${items.length} items across ${categories.length} categories (${categories.join(", ")}). ${missingUrl} item(s) without a URL.`,
          },
        ],
        structuredContent: { valid: true, total: items.length, perCategory, missingUrl },
      };
    } catch (error) {
      const message =
        error instanceof ParseError ? error.message : (error as Error).message;
      return {
        content: [{ type: "text", text: `Invalid item list: ${message}` }],
        structuredContent: { valid: false, error: message },
        isError: true,
      };
    }
  },
});
