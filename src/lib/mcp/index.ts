import { defineMcp } from "@lovable.dev/mcp-js";

import newsletterSchemaTool from "./tools/newsletter-schema";
import outlineNewsletterTool from "./tools/outline-newsletter";
import validateItemsTool from "./tools/validate-items";

export default defineMcp({
  name: "json-to-pdf-pal",
  title: "JSON to PDF Pal",
  version: "0.1.0",
  instructions:
    "Tools for the Research Support newsletter builder. Use `newsletter_schema` to learn the accepted JSON item format, `validate_items` to check an item list, and `outline_newsletter` to group items into the newsletter's sections. PDF rendering itself happens in the app.",
  tools: [newsletterSchemaTool, validateItemsTool, outlineNewsletterTool],
});
