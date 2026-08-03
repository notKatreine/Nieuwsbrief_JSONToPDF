import { defineTool } from "@lovable.dev/mcp-js";

import {
  CATEGORY_ALIASES,
  DEFAULT_HEADER_EN,
  DEFAULT_HEADER_NL,
  DEFAULT_SECTIONS,
  MONTHS_EN,
} from "@/lib/newsletter/types";

export default defineTool({
  name: "newsletter_schema",
  title: "Newsletter item schema",
  description:
    "Describe the JSON item format this app accepts, the navigator sections, category aliases and the default Dutch/English header texts.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const schema = {
      itemFieldsNl: ["categorie", "titel", "organisatie", "beschrijving", "deadline", "url"],
      itemFieldsEn: ["category", "title", "organization", "description", "deadline", "url"],
      sections: DEFAULT_SECTIONS.map((section) => ({
        labelNl: section.labelNl,
        labelEn: section.labelEn,
        categories: section.categories,
      })),
      categoryAliases: CATEGORY_ALIASES,
      months: MONTHS_EN,
      defaultHeaders: { nl: DEFAULT_HEADER_NL, en: DEFAULT_HEADER_EN },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(schema, null, 2) }],
      structuredContent: schema,
    };
  },
});
