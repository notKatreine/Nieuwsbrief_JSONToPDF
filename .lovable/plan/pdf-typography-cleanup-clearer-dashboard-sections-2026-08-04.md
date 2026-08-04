# PDF typography cleanup + clearer dashboard sections

Two separate fixes: make the PDF text look consistent within a sentence, and make the editor's sections visually separated.

## 1. PDF typography

Today several sentences mix runs with different sizes, weights and line heights, which reads as "the font changes mid-sentence":

- The deadline line is 11pt while the item body around it is 9pt, and both label and date are bold — the jump is much bigger than the +2 intended.
- Inline email/URL runs inside body text carry colour and underline but inherit whatever style their parent had, so a sentence can mix a styled run with an unstyled one.
- The cover panel mixes bold intro/nav text (`panelBold`, 9.5pt) with regular panel text (`panelText`, 9.5pt) and linkified runs in a different colour inside the same sentence.
- Headings use `characterSpacing` while body text does not, adding another visual inconsistency.

Changes in `src/lib/newsletter/pdf.ts`:

- Define one type scale and use it everywhere: body 9pt, item title 9.5pt bold, deadline 9.5pt (label bold, date bold, same size as the title — pronounced through weight and colour rather than size), section heading 11pt, category subtitle 9.5pt.
- Give the deadline its own visual accent that does not change the font size: red bold label, ink bold date.
- Make inline link runs inherit size and line height from the surrounding paragraph — only colour and underline differ.
- Apply a single `lineHeight` to all body-level styles so wrapped lines sit on the same rhythm.
- Drop `characterSpacing` from the category subtitle (keep it only on the section heading, where it's a deliberate label treatment).
- Update the height-estimation helpers (`itemHeight`, deadline allowance) to match the new sizes so column packing stays accurate.

## 2. Dashboard section clarity

In `src/routes/index.tsx` each panel is a flat `rounded-xl border p-4` card, so the navigator editor, category labels and item lists all blend together.

- Give every editor panel a clear header strip: title in a slightly tinted header row with a bottom divider, content below with its own padding.
- Strengthen the frame: heavier border and a soft shadow on each panel, so start and end of a panel is obvious.
- Inside the item editor, separate each item with a visible divider and give the NL/EN lists their own labelled sub-panels.
- Add consistent vertical spacing between panels so groups read as distinct blocks.

No functional/behaviour changes — layout, spacing and styling only, using existing design tokens (no hardcoded colours).

## Verification

Render the PDF in the preview and inspect pages 1–4 as images to confirm no mid-sentence size shifts and that column packing still fits inside the red bars; screenshot the dashboard to confirm panel separation.
