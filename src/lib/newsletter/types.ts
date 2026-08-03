export type Lang = "nl" | "en";

export interface RawNlItem {
  categorie: string;
  titel: string;
  organisatie: string;
  beschrijving: string;
  deadline: string;
  url: string;
}

export interface RawEnItem {
  category: string;
  title: string;
  organization: string;
  description: string;
  deadline: string;
  url: string;
}

export interface Item {
  id: string;
  category: string;
  title: string;
  organization: string;
  description: string;
  deadline: string;
  url: string;
  included: boolean;
}

/** A navigator entry maps one label to one or more source categories. */
export interface NavSection {
  id: string;
  labelNl: string;
  labelEn: string;
  categories: string[];
}

export interface LangHeader {
  intro: string;
  subtitle: string;
  reminder: string;
}

/** Dutch month name -> English month name for the header bar. */
export const MONTHS_EN: Record<string, string> = {
  januari: "January",
  februari: "February",
  maart: "March",
  april: "April",
  mei: "May",
  juni: "June",
  juli: "July",
  augustus: "August",
  september: "September",
  oktober: "October",
  november: "November",
  december: "December",
};

export interface NewsletterState {
  month: string;
  year: string;
  nl: Item[];
  en: Item[];
  headerNl: LangHeader;
  headerEn: LangHeader;
  sections: NavSection[];
  /** Ids of validation warnings the user chose to hide. */
  dismissedFindings: string[];
  /** Dutch/English label pairs for the item categories. */
  categoryLabels: CategoryLabel[];
}

export const CATEGORY_ALIASES: Record<string, string[]> = {
  nieuws: ["Nieuws", "News"],
  bijeenkomsten: ["Bijeenkomsten", "Meetings", "Events"],
  calls: ["NWO", "ZonMW", "Internationaal", "International", "Overige", "Other", "Intern"],
};

export const DEFAULT_SECTIONS: NavSection[] = [
  {
    id: "sec-nieuws",
    labelNl: "Nieuws",
    labelEn: "News",
    categories: CATEGORY_ALIASES.nieuws,
  },
  {
    id: "sec-bijeenkomsten",
    labelNl: "Bijeenkomsten",
    labelEn: "Meetings",
    categories: CATEGORY_ALIASES.bijeenkomsten,
  },
  {
    id: "sec-calls",
    labelNl: "Open calls",
    labelEn: "Open calls",
    categories: CATEGORY_ALIASES.calls,
  },
];

export const DEFAULT_HEADER_NL: LangHeader = {
  intro:
    "Welkom bij de Research Support nieuwsbrief! Deze keer in de nieuwsbrief: nieuws vanuit de cETO, OpenEU en vele nieuwe calls.",
  subtitle: "Maandelijkse Research Support nieuwsbrief",
  reminder:
    "Ter herinnering: het is verplicht om het ProjectBureau projectbureau@ou.nl te betrekken bij het aanvraagproces. Het ProjectBureau zorgt voor een gedegen budget, welke in afstemming is met de faculteit en begeleidt het proces voor accordering van het project door de rector magnificus (zg. CvB-checklist).",
};

export const DEFAULT_HEADER_EN: LangHeader = {
  intro:
    "Welcome to the Research Support newsletter! In this issue: news from cETO and OpenEU, plus many new calls for proposals.",
  subtitle: "Monthly Research Support Newsletter",
  reminder:
    "As a reminder, it is mandatory to involve the ProjectBureau projectbureau@ou.nl in the application process. The ProjectBureau provides a solid budget, which is in coordination with the faculty and guides the process for approval of the project by the rector magnificus (so-called CvB checklist).",
};

/** One category shown with a Dutch and an English label. */
export interface CategoryLabel {
  /** Stable key (slug of the Dutch label) used for anchors and lookups. */
  key: string;
  labelNl: string;
  labelEn: string;
}

export const DEFAULT_CATEGORY_LABELS: CategoryLabel[] = [
  { key: "nieuws", labelNl: "Nieuws", labelEn: "News" },
  { key: "bijeenkomsten", labelNl: "Bijeenkomsten", labelEn: "Meetings" },
  { key: "nwo", labelNl: "NWO", labelEn: "NWO" },
  { key: "zonmw", labelNl: "ZonMW", labelEn: "ZonMW" },
  { key: "internationaal", labelNl: "Internationaal", labelEn: "International" },
  { key: "overige", labelNl: "Overige", labelEn: "Other" },
  { key: "intern", labelNl: "Intern", labelEn: "Internal" },
];

/** Extra spellings that should resolve to an existing category key. */
const CATEGORY_KEY_HINTS: Record<string, string> = {
  events: "bijeenkomsten",
  meeting: "bijeenkomsten",
  internal: "intern",
};

export const categorySlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Resolve a raw category name (either language) to its stable key. */
export function categoryKeyOf(labels: CategoryLabel[], category: string): string {
  const needle = category.trim().toLowerCase();
  if (!needle) return "";
  const match = labels.find(
    (label) =>
      label.labelNl.trim().toLowerCase() === needle ||
      label.labelEn.trim().toLowerCase() === needle ||
      label.key === needle,
  );
  if (match) return match.key;
  return CATEGORY_KEY_HINTS[needle] ?? categorySlug(category);
}

/** Label to display for a raw category name in the given language. */
export function categoryLabelFor(
  labels: CategoryLabel[],
  category: string,
  lang: Lang,
): string {
  const key = categoryKeyOf(labels, category);
  const match = labels.find((label) => label.key === key);
  if (!match) return category;
  const label = lang === "nl" ? match.labelNl : match.labelEn;
  return label.trim() || category;
}

/** Add pairs for any category found in the data that has no entry yet. */
export function syncCategoryLabels(
  labels: CategoryLabel[],
  categories: string[],
): CategoryLabel[] {
  let next = labels;
  for (const category of categories) {
    const name = category.trim();
    if (!name) continue;
    const key = categoryKeyOf(next, name);
    if (next.some((label) => label.key === key)) continue;
    next = next === labels ? [...labels] : next;
    next.push({ key, labelNl: name, labelEn: name });
  }
  return next;
}
