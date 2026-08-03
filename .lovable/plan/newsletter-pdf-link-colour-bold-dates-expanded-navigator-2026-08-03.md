# Newsletter PDF: link colour, bold dates, expanded navigator

Three presentation tweaks in the PDF builder (`src/lib/newsletter/pdf.ts`).

## 1. Blue hyperlinks

Item titles already render blue and underlined. Extend the same treatment to every other clickable text so links read consistently:

- Emails inside body text keep the blue link colour.
- The cover panel sits on a red background, so its links stay in the light contrast colour (blue is unreadable on red) — they remain underlined so they still read as clickable.
- Descriptions containing bare URLs/emails get linkified in blue as well.

## 2. Bold deadline dates

The deadline line currently bolds only the label. Both the label and the date value become bold, for Dutch ("Sluitingsdatum") and English ("Deadline").

## 3. Navigator shows categories

On both cover pages, each navigator entry expands into its label plus the categories mapped to it, all separated by `|`:

```text
Nieuws | Bijeenkomsten | Open calls | International | NWO | Overige
```

Details:
- Only categories that actually have included items in that language are shown, so the list adapts per language and per edition.
- The section label links to the section heading, as today.
- Each category link jumps to that category's items: a small anchor is added at the first item of each category inside its section, so clicking "NWO" lands on the NWO items rather than the top of the section.
- The cover panel height estimate is updated to account for the longer navigator line so the red panel never clips.

## Technical notes

- `renderCover` builds nav runs from `SectionGroup.items` grouped by category (order follows the section's configured category order).
- New destination id scheme `\<sectionId\>-\<categorySlug\>-\<lang\>`, attached to the first item block of each category during block packing.
- Deadline change is a one-line edit in `renderBlock`.
- Verification: render the sample newsletter to PDF, convert pages to images, and visually confirm navigator wrapping, panel fit, blue links, and bold dates.
