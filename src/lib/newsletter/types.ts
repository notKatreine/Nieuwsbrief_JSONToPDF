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
