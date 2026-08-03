import type { Item, Lang, RawEnItem, RawNlItem } from "./types";

let counter = 0;
const nextId = (lang: Lang) => `${lang}-${Date.now().toString(36)}-${counter++}`;

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value);

export class ParseError extends Error {}

function pick(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    if (key in row) return asString(row[key]);
  }
  return null;
}

/**
 * Accepts either the Dutch field names (categorie/titel/...) or the English
 * ones (category/title/...), so a file dropped in the wrong slot still works.
 */
export function parseItems(json: unknown, lang: Lang): Item[] {
  if (!Array.isArray(json)) {
    throw new ParseError("The file must contain a JSON array of items.");
  }

  return json.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new ParseError(`Item ${index + 1} is not an object.`);
    }
    const row = entry as Record<string, unknown>;
    const category = pick(row, ["categorie", "category"]);
    const title = pick(row, ["titel", "title"]);

    if (category === null || title === null) {
      throw new ParseError(
        `Item ${index + 1} is missing a category/title field. Expected keys like "categorie" + "titel" or "category" + "title".`,
      );
    }

    return {
      id: nextId(lang),
      category: category || "Overige",
      title,
      organization: pick(row, ["organisatie", "organization"]) ?? "",
      description: pick(row, ["beschrijving", "description"]) ?? "",
      deadline: pick(row, ["deadline"]) ?? "",
      url: pick(row, ["url"]) ?? "",
      included: true,
    };
  });
}

export function parseFromRaw(raw: (RawNlItem | RawEnItem)[], lang: Lang): Item[] {
  return parseItems(raw, lang);
}

export function categoriesOf(items: Item[]): string[] {
  const seen: string[] = [];
  for (const item of items) {
    if (!seen.includes(item.category)) seen.push(item.category);
  }
  return seen;
}
