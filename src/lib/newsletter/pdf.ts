import { MONTHS_EN, categoryKeyOf, categoryLabelFor } from "./types";
import type { CategoryLabel, Item, Lang, NavSection, NewsletterState } from "./types";

/* ------------------------------------------------------------------ *
 * Layout constants (A4, points)
 * ------------------------------------------------------------------ */
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
const SIDE = 32;
const BAR_TOP_Y = 26;
const BAR_TOP_H = 56;
const BAR_BOT_H = 56;
const BAR_BOT_Y = PAGE_H - BAR_BOT_H - 26;
const MARGIN_TOP = BAR_TOP_Y + BAR_TOP_H + 16;
const MARGIN_BOTTOM = PAGE_H - BAR_BOT_Y + 14;
const BODY_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;
const GUTTER = 18;
const COL_W = (PAGE_W - 2 * SIDE - GUTTER) / 2;

export const RED = "#E2001A";
export const CREAM = "#FDF6F0";
export const CARD = "#F7F2EC";
export const LINK = "#1B5FA8";
export const INK = "#1A1A1A";
export const COVER_TITLE = "#D98C86";
export const PANEL_LINK = "#FFD9D5";
const COVER_BAR_H = 150;


/* ------------------------------------------------------------------ *
 * Grouping
 * ------------------------------------------------------------------ */
export interface SectionGroup {
  section: NavSection;
  label: string;
  items: Item[];
}

export function groupBySection(items: Item[], sections: NavSection[], lang: Lang): SectionGroup[] {
  const live = items.filter((item) => item.included);
  const used = new Set<string>();
  const groups: SectionGroup[] = [];

  for (const section of sections) {
    const matched = live.filter((item) => {
      if (used.has(item.id)) return false;
      return section.categories.some(
        (category) => category.toLowerCase() === item.category.toLowerCase(),
      );
    });
    matched.forEach((item) => used.add(item.id));
    if (matched.length > 0) {
      groups.push({
        section,
        label: lang === "nl" ? section.labelNl : section.labelEn,
        items: matched,
      });
    }
  }

  const leftovers = live.filter((item) => !used.has(item.id));
  if (leftovers.length > 0) {
    groups.push({
      section: {
        id: "sec-overig",
        labelNl: "Overige",
        labelEn: "Other",
        categories: [],
      },
      label: lang === "nl" ? "Overige" : "Other",
      items: leftovers,
    });
  }

  return groups;
}

/* ------------------------------------------------------------------ *
 * Column packing — pdfmake has no automatic newspaper column flow, so we
 * estimate block heights and distribute them across two columns per page.
 * ------------------------------------------------------------------ */
type Block =
  | { kind: "heading"; height: number; label: string; destination: string }
  | { kind: "subtitle"; height: number; label: string; destination: string }
  | { kind: "item"; height: number; item: Item; lang: Lang; anchor?: string };

const CHAR_W = 4.5; // average glyph width at 9pt

function textHeight(text: string, fontSize: number, lineHeight: number, bold = false): number {
  if (!text) return 0;
  // Word wrapping leaves ragged line ends, so assume slightly wider glyphs and
  // add half a line of slack per paragraph — underestimating pushes text under
  // the red footer bar.
  const charWidth = CHAR_W * (fontSize / 9) * (bold ? 1.06 : 1) * 1.2;
  const perLine = Math.max(12, Math.floor(COL_W / charWidth));
  const lines = text
    .split("\n")
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / perLine)) + 0.6, 0);
  return lines * lineHeight;
}

function itemHeight(item: Item): number {
  const heading = `${item.organization ? `${item.organization} | ` : ""}${item.title}`;
  return (
    textHeight(heading, 9.5, 12, true) +
    textHeight(item.description, 9, 11.5) +
    (item.deadline ? 15 : 0) +
    12
  );
}


/** Categories present in a group, ordered by the section's configured order. */
function groupCategories(group: SectionGroup): string[] {
  const present: string[] = [];
  const seen = new Set<string>();
  const push = (category: string) => {
    const key = category.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    present.push(category);
  };
  for (const configured of group.section.categories) {
    if (group.items.some((item) => item.category.toLowerCase() === configured.toLowerCase())) {
      push(configured);
    }
  }
  for (const item of group.items) push(item.category);
  return present;
}

function toBlocks(groups: SectionGroup[], lang: Lang, labels: CategoryLabel[]): Block[] {
  const blocks: Block[] = [];
  for (const group of groups) {
    blocks.push({
      kind: "heading",
      height: 26,
      label: group.label.toUpperCase(),
      destination: destSection(group.section.id, lang),
    });
    const categories = groupCategories(group);
    const showSubtitles = categories.length > 1;
    const seen = new Set<string>();
    for (const item of group.items) {
      const key = categoryKeyOf(labels, item.category);
      const first = !seen.has(key);
      seen.add(key);
      const destination = destCategory(group.section.id, key, lang);
      if (first && showSubtitles) {
        blocks.push({
          kind: "subtitle",
          height: 20,
          label: categoryLabelFor(labels, item.category, lang),
          destination,
        });
        blocks.push({ kind: "item", height: itemHeight(item), item, lang });
      } else {
        blocks.push({
          kind: "item",
          height: itemHeight(item),
          item,
          lang,
          anchor: first ? destination : undefined,
        });
      }
    }
  }
  return blocks;
}

interface PackedPage {
  left: Block[];
  right: Block[];
}

function packPages(blocks: Block[]): PackedPage[] {
  const pages: PackedPage[] = [];
  let page: PackedPage = { left: [], right: [] };
  let column: "left" | "right" = "left";
  let used = 0;

  const advance = () => {
    if (column === "left") {
      column = "right";
    } else {
      pages.push(page);
      page = { left: [], right: [] };
      column = "left";
    }
    used = 0;
  };

  // A heading or subtitle must never be the last thing in a column: measure it
  // together with the block(s) that must follow it.
  const requiredHeight = (index: number): number => {
    const block = blocks[index];
    if (!block) return 0;
    if (block.kind === "item") return block.height;
    const next = blocks[index + 1];
    if (!next) return block.height;
    if (block.kind === "heading" && next.kind === "subtitle") {
      const after = blocks[index + 2];
      return block.height + next.height + (after && after.kind === "item" ? after.height : 0);
    }
    return block.height + next.height;
  };

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (used > 0 && used + requiredHeight(i) > BODY_H - 24) advance();
    page[column].push(block);
    used += block.height;
  }


  if (page.left.length > 0 || page.right.length > 0) pages.push(page);
  return pages;
}

/* ------------------------------------------------------------------ *
 * Named destinations
 * ------------------------------------------------------------------ */
const destCover = (lang: Lang) => `cover-${lang}`;
const destSection = (sectionId: string, lang: Lang) => `${sectionId}-${lang}`;
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const destCategory = (sectionId: string, categoryKey: string, lang: Lang) =>
  `${sectionId}-cat-${slug(categoryKey)}-${lang}`;

/* ------------------------------------------------------------------ *
 * Content renderers
 * ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

function renderBlock(block: Block): Node {
  if (block.kind === "heading") {
    return {
      id: block.destination,
      text: block.label,
      style: "sectionHeading",
      margin: [0, 6, 0, 8],
    };
  }

  if (block.kind === "subtitle") {
    return {
      id: block.destination,
      text: block.label,
      style: "categorySubtitle",
      margin: [0, 2, 0, 6],
    };
  }



  const { item } = block;
  const headingText = `${item.organization ? `${item.organization} | ` : ""}${item.title}`;
  const deadlineLabel = block.lang === "nl" ? "Sluitingsdatum" : "Deadline";

  const stack: Node[] = [
    item.url
      ? {
          ...(block.anchor ? { id: block.anchor } : {}),
          text: headingText,
          link: item.url,
          style: "itemTitleLink",
        }
      : {
          ...(block.anchor ? { id: block.anchor } : {}),
          text: headingText,
          style: "itemTitle",
        },
  ];

  if (item.description) {
    stack.push({ text: linkifyEmails(item.description), style: "itemBody" });
  }
  if (item.deadline) {
    stack.push({
      text: [
        { text: `${deadlineLabel}: `, bold: true },
        { text: item.deadline, bold: true },
      ],
      style: "itemDeadline",
    });
  }

  return { stack, margin: [0, 0, 0, 10] };
}

function renderPage(page: PackedPage, isLast: boolean): Node {
  return {
    columns: [
      { width: COL_W, stack: page.left.map(renderBlock) },
      { width: GUTTER, text: "" },
      { width: COL_W, stack: page.right.map(renderBlock) },
    ],
    columnGap: 0,
    ...(isLast ? {} : { pageBreak: "after" }),
  };
}

const EMAIL_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

/** Split a paragraph into plain runs + clickable mailto runs. */
function linkifyEmails(text: string, color: string = LINK): Node[] {
  const runs: Node[] = [];
  let last = 0;
  for (const match of text.matchAll(EMAIL_RE)) {
    const index = match.index ?? 0;
    if (index > last) runs.push({ text: text.slice(last, index) });
    runs.push({
      text: match[0],
      link: `mailto:${match[0]}`,
      color,
      decoration: "underline",
    });

    last = index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.length > 0 ? runs : [{ text }];
}

const framedBox = (content: Node, borderColor: string, fill: string | null): Node => ({
  table: { widths: ["*"], body: [[content]] },
  layout: {
    fillColor: () => fill,
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => borderColor,
    vLineColor: () => borderColor,
    paddingLeft: () => 12,
    paddingRight: () => 12,
    paddingTop: () => 10,
    paddingBottom: () => 10,
  },
  margin: [0, 4, 0, 12],
});

function renderCover(
  state: NewsletterState,
  lang: Lang,
  groups: SectionGroup[],
  coverImage: string | null,
): Node {
  const header = lang === "nl" ? state.headerNl : state.headerEn;

  // Rounded red panel: pdfmake tables cannot round corners, so we draw a
  // rounded canvas of an estimated height and overlay the text on top.
  const panelW = PAGE_W - 2 * (SIDE + 4);
  const innerW = panelW - 44;
  const wrapped = (text: string, fontSize: number) => {
    // Conservative: assume slightly wide glyphs and add one line of slack per
    // paragraph so long intros/reminders never spill outside the panel.
    const perLine = Math.max(12, Math.floor(innerW / (CHAR_W * (fontSize / 9) * 1.18)));
    return text
      .split("\n")
      .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / perLine)) + 0.3, 0);
  };

  // Navigator: collect entries, then wrap them into explicit lines so the
  // measured height always matches what is rendered.
  const entries: { text: string; destination: string }[] = [];
  groups.forEach((group) => {
    entries.push({ text: group.label, destination: destSection(group.section.id, lang) });
    const categories = groupCategories(group);
    if (categories.length > 1) {
      categories.forEach((category) =>
        entries.push({
          text: categoryLabelFor(state.categoryLabels, category, lang),
          destination: destCategory(
            group.section.id,
            categoryKeyOf(state.categoryLabels, category),
            lang,
          ),
        }),
      );
    }
  });

  const NAV_CHAR_W = CHAR_W * (9.5 / 9) * 1.18 * 1.06; // bold glyphs run wider
  const navPerLine = Math.max(20, Math.floor(innerW / NAV_CHAR_W));
  const navLines: { text: string; destination: string }[][] = [];
  let currentLine: { text: string; destination: string }[] = [];
  let currentLen = 0;
  for (const entry of entries) {
    const cost = entry.text.length + 5; // separator "  |  "
    if (currentLine.length > 0 && currentLen + cost > navPerLine) {
      navLines.push(currentLine);
      currentLine = [];
      currentLen = 0;
    }
    currentLine.push(entry);
    currentLen += cost;
  }
  if (currentLine.length > 0) navLines.push(currentLine);

  const navNodes: Node[] = navLines.map((line, lineIndex) => ({
    text: line.flatMap((entry, index) => {
      const runs: Node[] = [];
      if (index > 0) runs.push({ text: "  |  ", color: "#FFFFFF" });
      runs.push({
        text: entry.text,
        linkToDestination: entry.destination,
        color: PANEL_LINK,
        decoration: "underline",
      });
      return runs;
    }),
    style: "panelBold",
    margin: [0, lineIndex === 0 ? 12 : 3, 0, 0],
  }));

  const introLines = header.intro
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const panelBody: Node[] = introLines.map((line, index) => ({
    text: line,
    style: "panelBold",
    margin: [0, index === 0 ? 0 : 8, 0, 0],
  }));

  panelBody.push(...navNodes);

  if (header.reminder) {
    panelBody.push({
      text: linkifyEmails(header.reminder, PANEL_LINK),
      style: "panelText",
      margin: [0, 14, 0, 0],
    });
  }

  panelBody.push({
    text: [
      {
        text: lang === "nl" ? "Vragen? Stuur een e-mail naar " : "Questions? Send an email to ",
        bold: true,
      },
      ...linkifyEmails("researchsupport@ou.nl", PANEL_LINK),
    ],
    style: "panelText",
    margin: [0, 14, 0, 0],
  });

  let panelH = 52; // top + bottom padding
  introLines.forEach((line, index) => {
    panelH += wrapped(line, 9.5) * 12 + (index === 0 ? 0 : 8);
  });
  // navigator: one measured line each, plus its top margins
  panelH += 12 + navLines.length * 13 + Math.max(0, navLines.length - 1) * 3;
  if (header.reminder) panelH += 14 + wrapped(header.reminder, 9.5) * 12;
  panelH += 14 + 12; // contact line
  panelH += 14; // safety
  panelH = Math.round(panelH);


  const panel: Node = {
    unbreakable: true,
    stack: [
      {
        canvas: [{ type: "rect", x: 0, y: 0, w: panelW, h: panelH, r: 16, color: RED }],
      },
      { stack: panelBody, margin: [22, -panelH + 26, 22, 0] },
    ],
  };

  // Fit the whole cover inside one page: shrink the spacing and the
  // illustration when a long intro/reminder makes the panel tall.
  const titleTop = COVER_BAR_H - MARGIN_TOP + 46;
  const titleH = Math.max(1, Math.ceil(header.subtitle.length / 40)) * 30;
  const cardW = 210;
  const cardH = 176;
  let imageGap = 26;
  let panelGap = 28;
  let scale = 1;
  const budget = BODY_H - 4;
  const total = () => titleTop + titleH + imageGap + cardH * scale + panelGap + panelH;

  if (coverImage && total() > budget) {
    imageGap = 12;
    panelGap = 14;
    const room = budget - (titleTop + titleH + imageGap + panelGap + panelH);
    scale = Math.max(0.35, Math.min(1, room / cardH));
  }

  const stack: Node[] = [
    {
      text: header.subtitle,
      style: "coverTitleSoft",
      id: destCover(lang),
      margin: [24, titleTop, 24, 0],
    },
  ];

  if (coverImage) {
    const boxH = Math.round(cardH * scale);
    const boxW = Math.round(cardW * scale);
    stack.push({
      unbreakable: true,
      stack: [
        {
          canvas: [
            {
              type: "rect",
              x: (PAGE_W - 2 * (SIDE + 4) - boxW) / 2,
              y: 0,
              w: boxW,
              h: boxH,
              r: 12,
              color: "#FFFFFF",
            },
          ],
          margin: [0, imageGap, 0, 0],
        },
        {
          image: coverImage,
          width: Math.round(190 * scale),
          alignment: "center",
          margin: [0, -(boxH - Math.round(8 * scale)), 0, 0],
        },
      ],
    });
  }

  stack.push({ ...panel, margin: [0, panelGap, 0, 0] });

  return { stack, pageBreak: "after" };

}


/* ------------------------------------------------------------------ *
 * Document definition
 * ------------------------------------------------------------------ */
export interface BuildAssets {
  logo: string | null;
  cover: string | null;
}

export interface BuiltDocument {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  docDefinition: any;
  pageCount: number;
  pageLangs: Lang[];
}

export function buildDocument(state: NewsletterState, assets: BuildAssets): BuiltDocument {
  const nlGroups = groupBySection(state.nl, state.sections, "nl");
  const enGroups = groupBySection(state.en, state.sections, "en");
  const labels = state.categoryLabels ?? [];
  const nlPages = packPages(toBlocks(nlGroups, "nl", labels));
  const enPages = packPages(toBlocks(enGroups, "en", labels));

  const pageLangs: Lang[] = [
    "nl",
    ...nlPages.map(() => "nl" as Lang),
    "en",
    ...enPages.map(() => "en" as Lang),
  ];
  const pageCount = pageLangs.length;

  const content: Node[] = [];
  content.push(renderCover(state, "nl", nlGroups, assets.cover));
  nlPages.forEach((page) => content.push(renderPage(page, false)));
  content.push(renderCover(state, "en", enGroups, assets.cover));
  enPages.forEach((page, index) => content.push(renderPage(page, index === enPages.length - 1)));

  const coverPages = new Set<number>([1, nlPages.length + 2]);
  const monthLabel = (lang: Lang) =>
    `${lang === "en" ? (MONTHS_EN[state.month.toLowerCase()] ?? state.month) : state.month} ${state.year}`.trim();

  const header = (currentPage: number) => {
    const lang = pageLangs[currentPage - 1] ?? "nl";
    const switchLabel = lang === "nl" ? "English version" : "Nederlandse versie";
    const switchTarget = destCover(lang === "nl" ? "en" : "nl");
    const isCover = coverPages.has(currentPage);

    if (isCover) return { text: "" };


    const bar: Node = {
      canvas: [
        {
          type: "rect",
          x: SIDE,
          y: BAR_TOP_Y,
          w: PAGE_W - 2 * SIDE,
          h: BAR_TOP_H,
          r: 18,
          color: RED,
        },
      ],
    };

    const columns: Node[] = [
      { width: "*", text: monthLabel(lang), style: "barText", alignment: "left" },
      { width: "auto", text: "Research Support", style: "barText", alignment: "center" },
      {
        width: "*",
        text: switchLabel,
        linkToDestination: switchTarget,
        style: "barLink",
        alignment: "right",
      },
    ];

    return {
      stack: [
        bar,
        {
          columns,
          margin: [SIDE + 16, -(BAR_TOP_H / 2) - 14, SIDE + 16, 0],
        },
      ],
    };
  };



  const footer = (currentPage: number, realPageCount: number) => {
    if (coverPages.has(currentPage)) return { text: "" };
    const bar: Node[] = [
      {

        canvas: [
          {
            type: "rect",
            x: SIDE,
            y: 0,
            w: PAGE_W - 2 * SIDE,
            h: BAR_BOT_H,
            r: 18,
            color: RED,
          },
        ],
      },
    ];

    const inner: Node[] = [];
    if (assets.logo) {
      inner.push({ width: 150, image: assets.logo, fit: [150, 40] });
    } else {
      inner.push({ width: 150, text: "Research Support Office", style: "barText" });
    }
    inner.push({ width: "*", text: "" });
    inner.push({
      width: "auto",
      text: `${currentPage} | ${realPageCount || pageCount}`,
      style: "barText",
      alignment: "right",
    });

    bar.push({
      columns: inner,
      margin: [SIDE + 16, -(BAR_BOT_H) + 10, SIDE + 16, 0],
    });

    return { stack: bar, margin: [0, 0, 0, 0] };
  };

  const docDefinition = {
    pageSize: { width: PAGE_W, height: PAGE_H },
    pageMargins: [SIDE + 4, MARGIN_TOP, SIDE + 4, MARGIN_BOTTOM],
    background: (currentPage: number) => {
      const nodes: Node[] = [
        { canvas: [{ type: "rect", x: 0, y: 0, w: PAGE_W, h: PAGE_H, color: CREAM }] },
      ];
      if (coverPages.has(currentPage)) {
        nodes.push({
          canvas: [{ type: "rect", x: 0, y: 0, w: PAGE_W, h: COVER_BAR_H, color: RED }],
          absolutePosition: { x: 0, y: 0 },
        });
        if (assets.logo) {
          nodes.push({
            image: assets.logo,
            fit: [PAGE_W - 60, COVER_BAR_H - 30],
            absolutePosition: { x: 30, y: 16 },
          });
        } else {
          nodes.push({
            text: "Research Support Office",
            style: "barText",
            fontSize: 26,
            absolutePosition: { x: 30, y: 45 },
          });
        }
      }
      return nodes;
    },

    header,
    footer,
    content,
    defaultStyle: { font: "Roboto", fontSize: 9, color: INK, lineHeight: 1.15 },
    styles: {
      barText: { color: "#FFFFFF", fontSize: 12, bold: true },
      barLink: { color: "#FFFFFF", fontSize: 11, decoration: "underline" },
      coverTitle: { fontSize: 22, bold: true, color: RED },
      coverTitleSoft: { fontSize: 25, color: COVER_TITLE, alignment: "center", lineHeight: 1.1 },
      panelText: { fontSize: 9.5, color: "#FFFFFF" },
      panelBold: { fontSize: 9.5, bold: true, color: "#FFFFFF" },
      coverIntro: { fontSize: 10.5, margin: [0, 0, 0, 8] },
      coverIntroFramed: { fontSize: 10.5 },
      coverNav: { fontSize: 10.5, bold: true },
      coverNote: { fontSize: 9.5 },

      sectionHeading: { fontSize: 11, bold: true, color: RED, characterSpacing: 0.4 },
      categorySubtitle: { fontSize: 9.5, bold: true, color: RED, characterSpacing: 0.3 },
      itemTitle: { fontSize: 9.5, bold: true },
      itemTitleLink: { fontSize: 9.5, bold: true, color: LINK, decoration: "underline" },
      itemBody: { fontSize: 9, margin: [0, 2, 0, 0] },
      itemDeadline: { fontSize: 11, margin: [0, 3, 0, 0] },
    },
  };

  return { docDefinition, pageCount, pageLangs };
}
