import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { ParseError, parseItems } from "@/lib/newsletter/parse";
import { DEFAULT_SECTIONS, type Lang } from "@/lib/newsletter/types";

export default defineTool({
  name: "outline_newsletter",
  title: "Outline newsletter",
  description:
    "Group a JSON array of newsletter items into the newsletter's navigator sections (News, Meetings, Open calls) and return the resulting outline of titles.",
  inputSchema: {
    json: z.string().min(1).describe("Raw JSON text containing an array of newsletter items."),
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
      const lang = language as Lang;
      const items = parseItems(parsedJson, lang);
      const used = new Set<string>();

      const sections = DEFAULT_SECTIONS.map((section) => {
        const matched = items.filter((item) => {
          const hit = section.categories.some(
            (category) => category.toLowerCase() === item.category.toLowerCase(),
          );
          if (hit) used.add(item.id);
          return hit;
        });
        return {
          label: lang === "nl" ? section.labelNl : section.labelEn,
          items: matched.map((item) => ({
            title: item.title,
            organization: item.organization,
            deadline: item.deadline,
            url: item.url,
          })),
        };
      });

      const unmatched = items
        .filter((item) => !used.has(item.id))
        .map((item) => ({ title: item.title, category: item.category }));

      const text = sections
        .map(
          (section) =>
            `${section.label} (${section.items.length})\n` +
            section.items.map((item) => `  - ${item.title}`).join("\n"),
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: unmatched.length
              ? `${text}\n\nUnmatched categories: ${unmatched.map((u) => u.category).join(", ")}`
              : text,
          },
        ],
        structuredContent: { sections, unmatched },
      };
    } catch (error) {
      const message = error instanceof ParseError ? error.message : (error as Error).message;
      return {
        content: [{ type: "text", text: `Could not outline items: ${message}` }],
        isError: true,
      };
    }
  },
});
