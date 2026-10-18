# Shall I drink wine?

A chalk-pen blackboard on a wine bar's brick wall asks a few questions and
always says yes. At the end the board is wiped and redrawn as Today's
Specials, the whole flowchart, with your route in pink.

Jekyll with no plugins, one page, one script. Every word is in
`_data/pathway.yml`.

## Editing the words: `_data/pathway.yml`

Change any text in quotes and save. Rules the board follows by itself:

- **wine** turns pink wherever it appears in a question or verdict.
- **Great!** at the very start of a verdict turns blue.
- Loading lines are yellow.

After any change, check it still holds together:

    ruby scripts/validate-pathway.rb

It fails if an answer points nowhere, a node can't be reached, a route can't
end, a route asks more than 5 questions, or something has no place on the
reveal board. The deploy runs it too and stops if it fails.

### Add a question

1. Add a node under `nodes:` with a new id:

        q4_cheese:
          type: question
          text: "Is there cheese?"
          board_label: "Cheese?"
          options:
            - { label: "Yes", next: v_great }
            - { label: "No", next: v_great }

2. Point an existing answer's `next:` at `q4_cheese`.
3. Give it a spot under `reveal: layout:`, e.g. `q4_cheese: { col: 3, row: 4 }`.

A verdict is the same without `options`, and with `type: verdict`.

### Add a loading line

Add a line under `loading_lines:`. Each visit uses every line once before
any repeats.

### Move things on the reveal board

`reveal: layout:` gives every node a `col` (left to right) and `row` (top to
bottom). Fractions and negatives are fine; the board resizes itself round
whatever is there. `final` is A GLASS OF WINE. `loop` is the centre of the
little loop-the-loop on the arrow that runs back up the board (Why not? to
Sure?); that arrow then arcs over the top of everything.

## Swapping in your own drawings

All the hand-drawn pieces are standalone SVG files in `_includes/`:

- `loops/loop-1.svg` to `loop-3.svg`: the rings round answers and
  questions on the reveal board.
- `scribbles/scribble-1.svg` to `scribble-3.svg`: the zigzag fill on hover
  and keyboard focus.
- `doodles/*.svg`: the doodles round the board edges. `glass.svg` is also
  the loading animation and the glass beside the final node.
  `underline.svg` is the double underline under the headings.

**To replace one**, save your SVG over the file with the same name. To make
it pick up the site's colours, put a class on each stroke: `c-chalk`,
`c-wine`, `c-crisps` or `c-soda` (or `f-wine` for a pink fill). Loops and
scribbles use `stroke="currentColor"` instead. In `glass.svg`, give the wine
the class `wine` so the loading screen can fill it up.

**To add a variant**, save it as e.g. `loops/loop-4.svg` and add one matching
line to `_includes/art.html`. Names must start with `loop-`, `scribble-` or
`doodle-` there. Answers pick their loop and scribble at random, so no two on
one screen match.

**Scribble colour**: `--scribble` near the top of `assets/css/main.scss`.
Set it to `var(--crisps)` or `var(--soda)` instead of `var(--wine)`.

## Colours and fonts

`_sass/_palette.scss` holds every colour and font. The one exception is
`assets/favicon.svg`, which a browser loads on its own and so carries its
own hex codes. The brick wall takes its shades from the palette; to reshuffle
which brick gets which shade, change the seed in `scripts/brick-wall.rb` and
run `ruby scripts/brick-wall.rb`.

## Running it

In the container started by `.devcontainer/run.sh`:

    bundle exec jekyll serve --host 0.0.0.0 --port 9002 --force_polling

The port is whatever `PORTS` in `.devcontainer/kit.env` publishes.
`--force_polling` is there because file-change events from Windows don't
always reach the container. `python3 -m pytest` checks the project kit.

## Deploying

`.github/workflows/pages.yml` validates the pathway, builds and deploys to
GitHub Pages on every push to `main`. Pages must be set to "GitHub Actions"
in the repository settings. The workflow passes the right `--baseurl`.
