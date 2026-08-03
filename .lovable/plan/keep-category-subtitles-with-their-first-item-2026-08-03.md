# Keep category subtitles with their first item

## Problem

In the Dutch newsletter, the category subtitle "Internationaal" lands at the very bottom of a column while the first call under it starts in the next column/page. The same can happen to a section heading.

The column packer currently reserves a fixed 70pt of slack below a heading or subtitle. When the first item under it is taller than that slack (long description plus a deadline line), the item still gets pushed to the next column, leaving the label stranded.

## Fix

Change the packing rule in the PDF layout engine so a heading or subtitle is measured together with the block(s) that must follow it:

- Subtitle: required space = subtitle height + the height of the next item block.
- Section heading: required space = heading height + the next block (which is a subtitle or the first item); if the next block is a subtitle, include the item after it too.
- If that combined height does not fit in the remaining column space, advance to the next column/page before placing the heading or subtitle, so label and first item always travel together.
- Keep the existing overall column budget and safety margin unchanged so nothing runs under the red footer bar.

Edge case: if a heading plus its first item is taller than a full empty column, place it anyway (no infinite advance) — it simply starts a fresh column and wraps naturally.

## Verification

Render the newsletter with the current data, convert pages to images, and confirm that no section heading or category subtitle is the last thing in a column, and that page/column breaks still avoid the footer bar.

## Technical detail

Single-file change in `src/lib/newsletter/pdf.ts`, inside `packPages`: replace the `block.height + 70` heuristic with a look-ahead over the block list.
