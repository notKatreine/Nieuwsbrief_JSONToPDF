# Cover wrapping, category subtitles, bigger deadlines, ignore-all warnings

## 1. Cover navigator never overlaps the red panel

The navigator today is one long inline text run whose height is guessed with a
rough character-count formula. When there are many categories the guess is too
low and the links spill past the rounded red panel.

Changes:
- Measure the navigator with the same wrapping estimator used for the intro,
  but per-chip: lay the entries out into lines that fit the panel's inner
  width, so the line count is derived from the actual entries rather than one
  concatenated string.
- Render the navigator as those explicit lines (stacked rows of link runs with
  " | " separators), so wrapping happens where we measured it.
- Feed the measured line count into the panel-height calculation, plus a small
  slack, so the red panel always grows to contain the links.
- Keep the existing auto-shrink of the illustration when the panel gets tall,
  so the cover still fits one page.

## 2. Category subtitles inside the content pages

Right now the first item of each category silently carries the anchor. Instead:
- When a section has more than one category, emit a visible category subtitle
  block (smaller than the section heading, red or ink-with-rule styling) before
  that category's items, and put the named destination on the subtitle.
- Cover links for categories point at those subtitles, so "Internationaal"
  jumps to the "Internationaal" subtitle under "Open calls".
- Add the subtitle height into the column-packing estimate and treat a subtitle
  like a heading for orphan protection (never last in a column).

## 3. More pronounced deadlines

Increase the deadline style from 9pt to 11pt (bold stays), and bump the
estimated deadline height in the packer to match so nothing overflows.

## 4. Ignore all warnings

Add an "Ignore all warnings" button in the checks panel header that dismisses
every currently visible dismissible warning at once, via a new bulk action in
the newsletter state (appends all warning ids to `dismissedFindings`).
Errors stay visible and non-dismissible.

## Technical notes

- `src/lib/newsletter/pdf.ts`: navigator line-splitting + panel height,
  new `subtitle` block kind in `Block`/`toBlocks`/`renderBlock`/`packPages`,
  `itemDeadline` font size, new `categorySubtitle` style.
- `src/lib/newsletter/use-newsletter-state.ts`: `dismissAllFindings(ids)`.
- `src/components/newsletter/ChecksPanel.tsx`: ignore-all button.
- `src/routes/index.tsx`: wire the new action.
- Verify by rendering the PDF and inspecting the cover and content pages.
