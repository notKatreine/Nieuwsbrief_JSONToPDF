## Goal

Two additions to the builder, both frontend-only (no accounts, no backend — everything stays in the browser as today):

1. A **safety net** that inspects uploaded items and warns about problems before the PDF is built.
2. The ability to **write a one-off item by hand** instead of only importing JSON.

## 1. Upload safety net

A new "Checks" panel sits between *Source files* and *Header*, recalculating on every change (upload, edit, section change). Each finding shows a severity, a plain-language message, and a button that jumps to (and opens) the item or section it refers to.

Checks performed per language list, plus across the two lists:

| Check | Severity |
| --- | --- |
| Category matches no navigator section — the item will not appear under any heading | Error |
| Missing title | Error |
| Duplicate item (same URL, or same title within a category) | Warning |
| Missing URL | Warning |
| Missing or unparseable deadline (not a recognisable date, and not text like "doorlopend"/"ongoing") | Warning |
| Missing organisation or description | Warning |
| NL and EN lists have a different number of included items | Warning |
| Very long title/description likely to overflow its card in the PDF | Warning |
| No items included at all for a language | Error |

Presentation:
- A compact summary line always visible ("3 errors, 7 warnings" / "All checks passed"), expanding to the grouped list.
- Warnings are dismissible per finding (dismissals persist with the draft) so recurring known-good cases stop nagging.
- The Download PDF button stays enabled but, when errors exist, first shows a confirm dialog listing them.
- Each affected item also gets a small warning badge in the item list, so problems are visible where you fix them.

## 2. Add and write items by hand

- **"Add item" button** at the top of each language tab in section 4, creating a blank item at the end of the list, expanded and focused, with its category preset to the section currently being viewed (or the first navigator section).
- The new item uses the same editor fields as imported ones (category, title, organisation, description, deadline, URL) — so hand-written and imported items behave identically everywhere: reordering, include/exclude, section grouping, PDF rendering.
- **Category field becomes a combobox**: pick from categories already present in the uploaded files, or type a new one. This prevents the most common cause of an item silently disappearing from the PDF (a typo'd category that matches no section).
- **"Copy to other language"** on each item: duplicates the item into the other language list (same category and URL, text copied as-is for you to translate). This is what makes hand-writing practical, since every item normally needs an NL and EN version.
- **Delete** already exists and keeps working for hand-added items.

## Technical notes

- `src/lib/newsletter/validate.ts` (new): pure functions returning a typed `Finding[]` from `NewsletterState`; no UI knowledge, so it can be reused later.
- `src/components/newsletter/ChecksPanel.tsx` (new): renders the findings, handles dismissals and "jump to item".
- `src/lib/newsletter/use-newsletter-state.ts`: add `addItem(lang)`, `duplicateToOtherLanguage(lang, id)`, and a `dismissedFindings: string[]` field on the persisted state (migrated safely for existing drafts in localStorage).
- `src/components/newsletter/ItemEditor.tsx`: add the per-item warning badge, controlled accordion open state (so the panel can expand a specific item), and the category combobox.
- `src/routes/index.tsx`: mount the checks panel, the Add item button, and the confirm-on-errors download dialog.
- No changes to `pdf.ts` — hand-written items flow through the existing renderer unchanged.
- Verification: load the sample, deliberately break an item (blank URL, unmapped category, duplicate title), confirm the findings appear and the jump-to works; add a hand-written item, copy it to the other language, and check both appear in the rendered preview under the right section.
