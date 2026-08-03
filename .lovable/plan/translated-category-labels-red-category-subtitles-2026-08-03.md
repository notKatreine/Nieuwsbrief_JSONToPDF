# Translated category labels + red category subtitles

## The problem

Category names come straight from the JSON files. The Dutch file says
"Internationaal", "Overige"; the English file says whatever the export happens
to contain. So the category subtitles in the body and the category links on the
cover can show Dutch words inside the English half of the newsletter (or the
other way round).

Navigator *sections* already have a Dutch and an English label, so they
translate correctly. Categories don't have that pairing yet.

## Approach

Give categories the same treatment as sections: one category, two labels.

1. **Category label pairs live in the newsletter state.** Each pair is
   `{ key, labelNl, labelEn }`, where `key` is the lowercased category name.
   Both the Dutch and English spelling of the same category map to one pair, so
   "Internationaal" and "International" are one row.
2. **Seeded automatically.** The built-in alias table already groups the
   Dutch/English variants (Nieuws/News, Bijeenkomsten/Meetings,
   Internationaal/International, Overige/Other). On load, pairs are created from
   those aliases; any category found in the uploaded files that isn't covered
   gets a pair with the same text in both languages, so nothing disappears.
3. **Editable in the UI.** Under the section navigator editor, a compact
   "Category labels" list shows every category in play with a Dutch and an
   English field, so the team can fix or add a translation once and it applies
   everywhere.
4. **Used everywhere a category is shown.** The PDF looks up the label for the
   page's language when rendering category subtitles in the body and the
   category links on the cover navigator. Link targets stay keyed on the
   category key, so a link in the English cover jumps to the English subtitle.

## Red category subtitles

Category subtitles switch from ink to the brand red used by section headings,
kept one step smaller and bold so the hierarchy (section > category > item)
still reads clearly.

## Technical notes

- `src/lib/newsletter/types.ts`: add `CategoryLabel` and
  `categoryLabels: CategoryLabel[]` to `NewsletterState`, plus a default set
  derived from `CATEGORY_ALIASES`.
- `src/lib/newsletter/use-newsletter-state.ts`: migrate persisted state that
  predates the field, sync pairs when items are parsed/added, and add an
  update action.
- `src/components/newsletter/CategoryLabelEditor.tsx`: new small editor,
  rendered by `src/routes/index.tsx` next to the navigator editor.
- `src/lib/newsletter/pdf.ts`: resolve labels through the map in `toBlocks`
  (subtitles) and `renderCover` (navigator entries); change
  `categorySubtitle` colour to `RED`.
- Verify by rendering the PDF and checking the English pages show English
  category names and red subtitles.
