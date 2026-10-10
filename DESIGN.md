---
name: Edge
description: A daily puzzle book for quant interviews, where every solve stamps a square.
colors:
  cobalt: "#1E3FA8"
  highlighter-yellow: "#FFC93C"
  grid-ink: "#0B0C12"
  grid-rule: "#0B0C12"
  cell-white: "#FFFFFF"
  cobalt-ground: "#E9EDF8"
  cobalt-wash: "#DDE3F5"
  slate-muted: "#454E72"
  hairline: "#C5CCE4"
  on-cobalt: "#FFFFFF"
  on-cobalt-dim: "#C9D3F5"
  void-cell: "#0B0C12"
  on-void: "#9AA3C7"
  correct-green: "#11724A"
  wrong-red: "#B7282E"
typography:
  numeral:
    fontFamily: "Archivo, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "clamp(48px, 9vw, 96px)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontVariation: "\"wdth\" 70"
    fontFeature: "\"tnum\""
  display:
    fontFamily: "Archivo, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "clamp(34px, 5.4vw, 60px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.02em"
    fontVariation: "\"wdth\" 78"
  headline:
    fontFamily: "Archivo, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "clamp(24px, 3vw, 32px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 78"
  puzzle:
    fontFamily: "Archivo, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "clamp(22px, 2.6vw, 30px)"
    fontWeight: 700
    lineHeight: 1.22
    fontVariation: "\"wdth\" 82"
  title:
    fontFamily: "Archivo, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.15
    fontVariation: "\"wdth\" 78"
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "\"wdth\" 100"
  label:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  clue-number:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  pad: "22px"
  section: "36px"
  gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.grid-ink}"
    textColor: "{colors.cell-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
  button-solve:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.grid-ink}"
    rounded: "{rounded.none}"
    padding: "11px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.grid-ink}"
    rounded: "{rounded.none}"
    padding: "11px 18px"
  button-ghost-hover:
    backgroundColor: "{colors.cobalt-wash}"
  answer-field:
    backgroundColor: "{colors.cell-white}"
    textColor: "{colors.grid-ink}"
    rounded: "{rounded.none}"
    padding: "11px 14px"
  chip:
    backgroundColor: "{colors.cell-white}"
    textColor: "{colors.grid-ink}"
    rounded: "{rounded.none}"
    padding: "4px 9px"
  chip-pressed:
    backgroundColor: "{colors.grid-ink}"
    textColor: "{colors.cell-white}"
  cell:
    backgroundColor: "{colors.cell-white}"
    textColor: "{colors.grid-ink}"
    rounded: "{rounded.none}"
  cell-solved:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.grid-ink}"
  cell-missed:
    backgroundColor: "{colors.void-cell}"
    textColor: "{colors.on-void}"
  clue-numeral:
    backgroundColor: "{colors.cell-white}"
    textColor: "{colors.grid-ink}"
    size: "56px"
    rounded: "{rounded.none}"
  shell-bar:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    height: "60px"
  nav-link:
    textColor: "{colors.on-cobalt-dim}"
    padding: "19px 11px 17px"
  nav-link-active:
    textColor: "{colors.on-cobalt}"
---

# Design System: Edge

## Overview

**Creative North Star: "The Puzzle Book"**

Edge is printed on newsstand puzzle-magazine cover stock. A committed cobalt shell frames a pale cobalt-tinted ground, and on that ground everything that can be worked is a white cell bounded by a solid black rule. Progress is not a chart or a badge: it is a square that fills with highlighter yellow. The month is a seven-column grid of crossword squares, the problem bank is a numbered grid of one cell per problem, and the games are numbered clue rows under an "Across" heading. The page reads like a book you work through, not a dashboard you monitor.

Density is medium and print-like. Surfaces are flat white sheets with 2px black borders; there are no rounded corners anywhere and no decorative shadow. Type is a single variable family, Archivo, pulled narrow on its width axis for anything numeric or headline and left at normal width for reading text, so numbers feel chunky and condensed like puzzle-page numerals. Motion is limited to state: a solved cell flips into place, a rating bar slides to its value, a timer drains.

The world explicitly rejects the prep-site default: a sidebar of topics over a grey card dashboard with rounded tiles.

**Key Characteristics:**
- Cobalt shell, pale cobalt ground, white cells, solid black 2px rules.
- Highlighter yellow means exactly one thing: solved, or the act of solving.
- Zero radius everywhere; the square is the only silhouette.
- Archivo on its width axis: condensed (wdth 70 to 82) for numerals and headings, normal (wdth 100) for body.
- Superscript clue numerals in the corner of cells.
- Flat by default; depth comes from rules and fills, not shadow.

## Colors

A three-ink print palette (cobalt, yellow, black) on white and a cool tinted paper, with two functional feedback colors.

### Primary
- **Cover Cobalt** (`cobalt`): the committed shell colour. Fills the sticky top bar, the hover state of the primary button, the rating and timer fill, the today outline on the month grid, the selected-cell ring, scrollbar and text caret. It is structure and progress, never decoration.

### Secondary
- **Highlighter Yellow** (`highlighter-yellow`): the solved mark. Solved cells, the correct option, the solve/check button, the clue numeral on hover, the streak count, text selection, the focus ring, and open-decision placeholders on legal pages. Text on it is always grid ink.

### Neutral
- **Grid Ink** (`grid-ink`, `grid-rule`): text and the 2px rules that bound every sheet, cell, field and clue row. The two tokens share a value in light mode and separate in dark mode, where rules turn pale; keep them as separate roles.
- **Cell White** (`cell-white`): the paper of every sheet, cell, field and option.
- **Cobalt Ground** (`cobalt-ground`): the page background behind the sheets.
- **Cobalt Wash** (`cobalt-wash`): hover fill on clue rows, options and ghost buttons; disabled field fill; the share-result block.
- **Slate Muted** (`slate-muted`): secondary text, meta lines, labels, clue numerals in empty cells, footer.
- **Hairline** (`hairline`): the only sub-rule line, used for the reference baseline in the bankroll chart.
- **On Cobalt / On Cobalt Dim** (`on-cobalt`, `on-cobalt-dim`): text in the shell bar; dim for inactive nav, full white for active and hover.
- **Void Cell / On Void** (`void-cell`, `on-void`): the black square for a missed day, with its numeral in muted blue-grey.

### Feedback
- **Correct Green** (`correct-green`) and **Wrong Red** (`wrong-red`): feedback text only ("Solved before", right/wrong lines, struck-through wrong options). Never fills.

### Named Rules
**The Highlighter Rule.** Yellow is the solved mark. Use it for solved state, the solve action, and focus; never as a section background or decorative accent.

**The Cover Stock Rule.** Cobalt is the shell and the progress fill. It does not become a card background inside the page.

**The Dark Edition Rule.** Dark mode is a reprint, not a new palette: ground and paper become deep navy, ink and rules invert to pale, cobalt brightens slightly, and yellow stays identical. Values live in the sidecar.

## Typography

**Display Font:** Archivo variable (wdth 62 to 125, wght 400 to 800), falling back to Arial Narrow, Helvetica Neue
**Body Font:** Archivo at normal width, falling back to Helvetica Neue, Arial

**Character:** One grotesque used at two widths. Condensed and heavy, it is the puzzle-page numeral; at normal width it is a plain, legible reading face.

### Hierarchy
- **Numeral** (800, clamp 48 to 96px, 0.9, wdth 70, tabular): timers, scores, quiz results. Speed Math's prompt uses a sibling size (clamp 40 to 84px, wdth 75, centred).
- **Display** (800, clamp 34 to 60px, 0.98, wdth 78): page titles such as "Daily No. 8" and legal page titles.
- **Headline** (800, clamp 24 to 32px, 1.05, wdth 78): section heads such as "Across" and the month name. 24px on legal pages.
- **Puzzle** (700, clamp 22 to 30px, 1.22, wdth 82, max 34ch): the statement of today's problem.
- **Title** (700, 20px, 1.15): clue-row game names (19px there) and h3.
- **Body** (400, 16px, 1.55): reading text; lede at 17px capped near 60ch, legal text capped at 68ch.
- **Label** (600, 13px): meta lines, labels, chips, legend, stat captions (12px). Sentence case, no tracking.
- **Clue Number** (700, 10px, 1): superscript numeral in the top-left of a cell.

### Named Rules
**The Narrow Numeral Rule.** Every number a player reads as a score, count, rating or day sits in Archivo heavy at wdth 70 to 75 with tabular figures.

**The Sentence Case Rule.** Labels, meta, buttons and nav are sentence case at normal tracking; section heads such as "Across" are set in headline type, not as tracked microcopy.

## Layout

A single centred column, max 1180px with a 16px side gutter, under a sticky 60px cobalt bar. Main sections stack with a 36px gap; inside sheets, content stacks at 14px and inline rows at 10px. Sheets pad at 22px (16px under 560px).

The home viewport is a two-column split at 1.75fr / 1fr with a 20px gap: today's puzzle on the left, the month grid and stats on the right. It collapses to one column under 900px. Clue rows flow in an auto-fit grid of columns at least 340px wide, each row a 56px numeral, a body, and a "Play" affordance. The problem bank is an auto-fill grid of cells at least 44px. Game screens cap their sheet at 760 to 820px.

Under 760px the nav drops to its own full-width row as a three-column grid of links, and the streak moves right.

Grids of cells overlap by one rule (each cell has a -1px top and left margin) so adjacent 2px borders read as a single ruled grid rather than a gallery of boxes.

## Elevation & Depth

Flat. Depth is carried by 2px black rules, white paper on a tinted ground, and fills. The one exception is the transient storage notice pinned to the bottom of the viewport, which floats on a soft ambient shadow because it overlays content.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 12px 32px -8px rgba(11,12,18,.35)`): the fixed storage notice only.

Inset box-shadows are used as rings, not elevation: a 3px inset cobalt ring marks today's cell, and the focus treatment pairs a 3px yellow outline with a 5px ink halo.

### Named Rules
**The Ruled Paper Rule.** If a surface needs separation, give it a 2px rule, not a shadow.

## Shapes

Zero radius everywhere: sheets, buttons, fields, chips, options, cells, rating tracks and the timer. The square is the system's silhouette, from the 3x3 cell wordmark mark to the bank. Borders are 2px solid rules (1.5px on chips and the small difficulty dots). Rating tracks are ruled boxes with a fixed 2px marker at the 1000 rating so every bar is read on the same scale.

## Components

### Buttons
Blunt, printed, square.
- **Shape:** square corners (0px), 2px border matching the fill.
- **Primary:** grid ink fill, white text, 700 15px, 11px 18px padding. Hover turns cobalt.
- **Solve:** highlighter yellow with an ink border and ink text; the action that checks or quotes an answer.
- **Ghost:** transparent with an ink border; hover fills with cobalt wash.
- **Disabled:** 40% opacity, not-allowed cursor.
- **Focus:** the global ring (3px yellow outline, 2px offset, 5px ink halo).

### Chips
- **Style:** cell white, 1.5px ink border, 600 13px, 4px 9px padding, square.
- **State:** pressed chips invert to ink fill with white text. Used as Problem Bank filters.

### Cards / Containers (Sheets)
- **Corner Style:** square (0px).
- **Background:** cell white on the cobalt ground.
- **Shadow Strategy:** none; see Elevation & Depth.
- **Border:** 2px grid rule.
- **Internal Padding:** 22px, 16px on phones.

### Inputs / Fields
- **Style:** cell white, 2px rule, square, 700 20px tabular numerals, 11px 14px padding; placeholder in slate muted at 500.
- **Focus:** the global yellow-and-ink ring.
- **Disabled:** cobalt wash fill.
- Sliders use the native control tinted cobalt.

### Navigation
- **Style:** links in the cobalt bar, 600 14px, on-cobalt-dim at rest, full white on hover.
- **Active:** white text over a 3px yellow bottom rule.
- **Mobile:** a three-column grid row beneath the wordmark, ellipsised.
- **Wordmark:** a 3x3 grid of 7px squares (white, yellow, and outlined empties) beside "Edge" in Archivo 800 at wdth 80.

### Cell (signature)
The unit of the whole world: a square, white, 2px-ruled cell with a 10px superscript clue number in its top-left corner and a condensed heavy numeral or icon centred. Solved cells fill highlighter yellow. Missed days fill void black. Today's cell carries a 3px inset cobalt ring; a selected bank cell carries a 3px cobalt outline inset 6px. When a solve lands, the cell stamps: it flips from flat on its X axis into place over 0.7s on the out-expo ease.

### Clue Row
Games are listed as numbered clues: a 56px ruled numeral square, the game name in title type, a one-line description, the player's rating as a ruled track on a fixed scale with the number beside it, and a problem count. Rows are separated by 2px rules. Hover washes the row and fills the numeral square yellow.

### Options
Multiple-choice answers are full-width ruled rows with a 26px ruled key square. The right answer fills yellow; a wrong pick is struck through in wrong red.

### Stat Grid
A ruled table of figures: each cell has a 12px label over a 26px condensed heavy numeral, borders shared so the grid reads as one ruled block.

## Do's and Don'ts

### Do:
- **Do** bound every workable surface with a 2px solid rule and keep corners at 0px.
- **Do** reserve highlighter yellow for solved state, the solve action and focus.
- **Do** set every score, count, rating and date numeral in Archivo 800 at wdth 70 to 75 with tabular figures.
- **Do** express progress by filling a cell; overlap cell borders by 1px so grids read as one ruled sheet.
- **Do** draw ratings on the fixed-scale ruled track with the 1000 marker, so bars compare across games.
- **Do** keep motion to state changes (stamp, track fill, timer drain) and honour reduced motion by removing it.

### Don't:
- **Don't** round corners or soften rules into hairline grey borders on sheets, cells or controls.
- **Don't** use shadows to lift cards; the overlay shadow belongs to the floating notice alone.
- **Don't** use yellow as a background panel or cobalt as a card fill inside the page.
- **Don't** build a sidebar of topics over a grey card dashboard; the games are numbered clue rows.
- **Don't** add eyebrow or kicker labels above headings; the heading itself names the section.
