import type { Item, Lang, NavSection, NewsletterState } from "./types";

export type Severity = "error" | "warning";

export interface Finding {
  /** Stable key used for dismissals. */
  id: string;
  severity: Severity;
  message: string;
  lang?: Lang;
  itemId?: string;
  /** Errors are never dismissible. */
  dismissible: boolean;
}

const LONG_TITLE = 120;
const LONG_DESCRIPTION = 700;

/** Deadline values that are intentionally not a date. */
const OPEN_DEADLINE = /^(doorlopend|continu|geen|n\.?v\.?t\.?|ongoing|continuous|rolling|none|n\/a|-|—)$/i;

function isRecognisableDeadline(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  if (OPEN_DEADLINE.test(text)) return true;
  // A day number or a 4-digit year is enough to look like a date to a reader.
  if (/\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(text)) return true;
  if (/\d{4}/.test(text)) return true;
  if (/\d{1,2}\s+\p{L}{3,}/u.test(text)) return true;
  return false;
}

function sectionFor(category: string, sections: NavSection[]): NavSection | undefined {
  const needle = category.trim().toLowerCase();
  return sections.find((section) =>
    section.categories.some((entry) => entry.trim().toLowerCase() === needle),
  );
}

const langLabel = (lang: Lang) => (lang === "nl" ? "Dutch" : "English");

function itemLabel(item: Item, index: number): string {
  return item.title.trim() ? `"${item.title.trim().slice(0, 60)}"` : `item ${index + 1}`;
}

function checkList(items: Item[], lang: Lang, sections: NavSection[]): Finding[] {
  const findings: Finding[] = [];
  const included = items.filter((item) => item.included);

  const add = (
    item: Item,
    code: string,
    severity: Severity,
    message: string,
  ) =>
    findings.push({
      id: `${lang}:${item.id}:${code}`,
      severity,
      message,
      lang,
      itemId: item.id,
      dismissible: severity === "warning",
    });

  if (items.length > 0 && included.length === 0) {
    findings.push({
      id: `${lang}:global:none-included`,
      severity: "error",
      message: `No ${langLabel(lang)} items are included — that language section will be empty.`,
      lang,
      dismissible: false,
    });
  }

  const urlSeen = new Map<string, string>();
  const titleSeen = new Map<string, string>();

  included.forEach((item, index) => {
    const label = itemLabel(item, index);

    if (!item.title.trim()) {
      add(item, "no-title", "error", `${langLabel(lang)} item ${index + 1} has no title.`);
    }

    if (!sectionFor(item.category, sections)) {
      add(
        item,
        "no-section",
        "error",
        `${langLabel(lang)} ${label} has category "${item.category}", which is not listed in any navigator section — it will not appear in the PDF.`,
      );
    }

    if (!item.url.trim()) {
      add(item, "no-url", "warning", `${langLabel(lang)} ${label} has no link.`);
    } else if (!/^https?:\/\//i.test(item.url.trim())) {
      add(
        item,
        "bad-url",
        "warning",
        `${langLabel(lang)} ${label} has a link that does not start with http:// or https://.`,
      );
    }

    if (!isRecognisableDeadline(item.deadline)) {
      add(
        item,
        "deadline",
        "warning",
        item.deadline.trim()
          ? `${langLabel(lang)} ${label} has a deadline ("${item.deadline.trim()}") that does not look like a date.`
          : `${langLabel(lang)} ${label} has no deadline.`,
      );
    }

    if (!item.organization.trim()) {
      add(item, "no-org", "warning", `${langLabel(lang)} ${label} has no organisation.`);
    }

    if (!item.description.trim()) {
      add(item, "no-desc", "warning", `${langLabel(lang)} ${label} has no description.`);
    }

    if (item.title.trim().length > LONG_TITLE) {
      add(
        item,
        "long-title",
        "warning",
        `${langLabel(lang)} ${label} has a very long title and may overflow its card.`,
      );
    }

    if (item.description.trim().length > LONG_DESCRIPTION) {
      add(
        item,
        "long-desc",
        "warning",
        `${langLabel(lang)} ${label} has a very long description and may overflow its card.`,
      );
    }

    const urlKey = item.url.trim().toLowerCase().replace(/\/+$/, "");
    if (urlKey) {
      const previous = urlSeen.get(urlKey);
      if (previous) {
        add(
          item,
          "dup-url",
          "warning",
          `${langLabel(lang)} ${label} has the same link as "${previous}".`,
        );
      } else {
        urlSeen.set(urlKey, item.title.trim() || `item ${index + 1}`);
      }
    }

    const titleKey = `${item.category.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`;
    if (item.title.trim()) {
      const previous = titleSeen.get(titleKey);
      if (previous) {
        add(
          item,
          "dup-title",
          "warning",
          `${langLabel(lang)} ${label} appears twice in category "${item.category}".`,
        );
      } else {
        titleSeen.set(titleKey, item.title.trim());
      }
    }
  });

  return findings;
}

export function validateNewsletter(state: NewsletterState): Finding[] {
  const findings = [
    ...checkList(state.nl, "nl", state.sections),
    ...checkList(state.en, "en", state.sections),
  ];

  const nlCount = state.nl.filter((item) => item.included).length;
  const enCount = state.en.filter((item) => item.included).length;
  if (nlCount > 0 && enCount > 0 && nlCount !== enCount) {
    findings.push({
      id: "global:count-mismatch",
      severity: "warning",
      message: `The Dutch section has ${nlCount} included items and the English section has ${enCount}. Usually both should match.`,
      dismissible: true,
    });
  }

  return findings;
}

export function visibleFindings(findings: Finding[], dismissed: string[]): Finding[] {
  const set = new Set(dismissed);
  return findings.filter((finding) => !finding.dismissible || !set.has(finding.id));
}

/** Item id -> highest severity affecting it, for badges in the item list. */
export function findingsByItem(findings: Finding[]): Record<string, Severity> {
  const map: Record<string, Severity> = {};
  for (const finding of findings) {
    if (!finding.itemId) continue;
    if (finding.severity === "error" || !map[finding.itemId]) {
      map[finding.itemId] = finding.severity;
    }
  }
  return map;
}
