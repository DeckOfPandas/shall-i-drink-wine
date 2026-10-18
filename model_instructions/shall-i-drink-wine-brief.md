# Shall I Drink Wine? — build brief

A very silly single-purpose website. The visitor answers a few flowchart-style questions to settle the question "Shall I drink wine?". **The answer is always yes.** Every route through the questions ends in a cheerful instruction to have a glass of wine.

The site is themed as a **chalk-pen blackboard on the exposed-brick wall of a wine bar**. At the end, the board is wiped and redrawn as "Today's Specials", which turns out to be the full flowchart. That reveal shows that every route leads to the same place. It is the punchline of the whole site.

Owner: Helen (GitHub: `DeckOfPandas`). **All copy is Helen's and is final for the MVP.** Use it exactly as written in §3, including punctuation. Don't add, improve or invent jokes.

---

## 1. Stack and hosting

- **Jekyll on GitHub Pages**, new repo `DeckOfPandas/shall-i-drink-wine`, served at `https://deckofpandas.github.io/shall-i-drink-wine/`. Set `baseurl` to match.
- Vanilla HTML, CSS and JS. No framework, no bundler, no npm runtime dependencies. One small JS file runs the flow.
- **All content lives in `_data/pathway.yml`**: questions, answers, verdicts, board labels, loading lines, button labels and reveal layout. Jekyll injects it into the page as JSON (`<script type="application/json" id="pathway">{{ site.data.pathway | jsonify }}</script>`). Helen must be able to rewrite every word without touching code.
- No cookies, no analytics, no external requests except Google Fonts.
- Sibling site by the same owner, for reference only: `DeckOfPandas/is-it-rhubarb-yet`. **Copy its footer (the heart signature) exactly**, so the markup, wording and link match. Don't copy anything else from it; this site has its own look.

## 2. The flow

The visitor goes through these screens:

1. **Landing.** The board reads **SHALL I DRINK WINE?** with one button: "Let's go →".
2. **Question.** One question per screen, with hand-circled answer buttons (§6).
3. **Loading.** Shown between every question and after the last answer (§4).
4. **Verdict.** The verdict line in big chalk lettering, with a few doodles. One button: "What's on the board?".
5. **Reveal.** The board is wiped and the full flowchart is chalked up as **TODAY'S SPECIALS** (§5). It has one button: "Another glass?", which restarts from the landing screen.

There is no back button and no progress indicator. Decisions are final.

## 3. Pathway and copy

### Map

```
q1  Do you like wine?
├─ Yes → q2_now
│        ├─ Yes → q3_early
│        │        ├─ No  → v_great
│        │        └─ Yes → v_five_oclock
│        └─ No  → q3_why
│                 ├─ Driving        → v_driving
│                 ├─ Pregnant       → v_pregnant
│                 ├─ Not in mood    → v_mood
│                 └─ Don't like it  → q2_sure  (LOOP into the other branch)
└─ No  → q2_sure
         ├─ No  → v_great
         └─ Yes → q3_wrong
                  ├─ Yes → v_sorry
                  └─ No  → v_sorry
```

The longest route is five questions (q1 → q2_now → q3_why → q2_sure → q3_wrong). **Five questions is a hard ceiling.**

### Landing

| Field | Copy |
|---|---|
| Heading | SHALL I DRINK WINE? |
| Button | Let's go → |

### Questions

| id | Question | Board label | Answers → next |
|---|---|---|---|
| `q1` | Do you like wine? | Like wine? | "Yes" → `q2_now` · "No" → `q2_sure` |
| `q2_now` | Do you want to have a glass of wine now? | Glass now? | "Yes" → `q3_early` · "No" → `q3_why` |
| `q3_early` | Is it 9am? | Breakfast wine? | "Yes" → `v_five_oclock` · "No" → `v_great` |
| `q3_why` | Why not? | Why not? | "I'm driving." → `v_driving` · "I'm pregnant." → `v_pregnant` · "I'm not in the mood." → `v_mood` · "I don't like wine." → `q2_sure` |
| `q2_sure` | Are you sure? | Sure? | "Yes" → `q3_wrong` · "No" → `v_great` |
| `q3_wrong` | Have you considered not being wrong? | Considered not being wrong? | "Yes" → `v_sorry` · "No" → `v_sorry` |

### Verdicts

| id | Verdict | Board label |
|---|---|---|
| `v_great` | Great! Have a glass of wine. | Great! |
| `v_five_oclock` | Well, if now is the time then now is the time. It's 5 o'clock somewhere, of course. But you know when it'll be 5 o'clock here? ... | 5 o'clock somewhere |
| `v_driving` | Great! Have a glass of wine when you get there. | Destination wine |
| `v_pregnant` | Great! Have a glass of wine in an average of 4½ months. Pop that in the diary, next to any incidental events that may be happening at around the same time. | Diarise |
| `v_mood` | You know what will help with that? Have a glass of wine! | Mood fixer |
| `v_sorry` | Sorry that didn't work out for you. Have a glass of wine about it. | Commiserations |

**Note on `v_five_oclock`:** the closing "..." is deliberate. It's the punchline, not a truncation. The reader supplies the obvious answer: it'll be 5 o'clock here at 5 o'clock. Don't complete it, trim it or "fix" it.

### Loading lines

- Refilling the crisps...
- Checking with the sommelier...
- Fetching the little black book of wine...
- Telling customers we don't serve Prosecco...
- Polishing the Coravins...
- Adding dust to the priciest bottles...

### Reveal

| Field | Copy |
|---|---|
| Verdict-screen button | What's on the board? |
| Board heading | TODAY'S SPECIALS |
| Final node | A GLASS OF WINE |
| Restart button | Another glass? |

### YAML shape (suggested; adjust if something cleaner emerges)

```yaml
start: q1

landing:
  heading: "SHALL I DRINK WINE?"
  button: "Let's go →"

nodes:
  q1:
    type: question
    text: "Do you like wine?"
    board_label: "Like wine?"
    options:
      - { label: "Yes", next: q2_now }
      - { label: "No",  next: q2_sure }
  # ...
  v_great:
    type: verdict
    text: "Great! Have a glass of wine."
    board_label: "Great!"

loading_lines:
  - "Refilling the crisps..."
  # ...

reveal:
  button: "What's on the board?"
  heading: "TODAY'S SPECIALS"
  final_node: "A GLASS OF WINE"
  restart: "Another glass?"
  layout:            # per-node grid positions for the reveal drawing
    q1: { col: 3, row: 1 }
    # ...
```

### Validation

Add `scripts/validate-pathway.rb` (Ruby, since Jekyll is already there). If the repo has a CI workflow, run it there too. It must check that:

- every `next` points to an existing node;
- every node is reachable from `start`;
- every route ends at a verdict (no dead ends; the one loop must still terminate);
- no simple route visits more than **5 questions**;
- every node has a `board_label` and a reveal layout position.

## 4. Loading screens

- Shown for a random **1.4–2.2 s** between screens.
- Show one line from `loading_lines`, in **crisps yellow** (§6). Lines don't repeat within a visit until the pool is exhausted, then reshuffle.
- Animation: a chalk-drawn wine glass filling with pink. Keep it subtle.
- With `prefers-reduced-motion`, skip the animation, show the line for about 1 s, and then move on.
- Announce the line in an `aria-live="polite"` region.

## 5. The reveal ("Today's Specials")

This is the important bit. Spend the polish budget here.

1. From the verdict screen, the visitor presses "What's on the board?". An **eraser wipe** clears the board (one or two diagonal swipes leaving faint chalk smudge).
2. **TODAY'S SPECIALS** is chalked across the top in the heading face.
3. The flowchart draws itself in, node by node, with lines drawn via SVG `stroke-dasharray`/`stroke-dashoffset`:
   - question nodes are loosely hand-circled (same style as the buttons, §6) and show their `board_label`;
   - verdict nodes show their `board_label`;
   - **every verdict has an arrow converging on one final, larger node: "A GLASS OF WINE"**, circled in pink with a little wine-glass doodle;
   - the `q3_why → q2_sure` loop is drawn as a big looping arrow across the board. That loop is a visual joke, so make it visible.
4. **The visitor's own route is highlighted in pink** (`#FF2D78`). The rest of the chart is chalk white.
5. Then "Another glass?" appears, which restarts from the landing screen.

- Layout comes from the grid positions in `pathway.yml`. Propose a sensible initial layout; Helen will tweak it.
- With reduced motion, show the finished board immediately, with no wipe and no draw-in.
- Accessibility: give the SVG `role="img"` with a title. Also provide a visually hidden text version of the visitor's route ("You said: … → … → A glass of wine").
- On narrow screens, the board must stay legible. Scale the SVG to the width and let the board scroll vertically if needed. Never scroll the page horizontally.

## 6. Visual design

### Concept

We're already inside the bar. The page is an **exposed red-brick wall**, and on it hangs a **wall-mounted blackboard in an oak frame** (no A-board legs). The lettering is **chalk pen, not dusty schoolroom chalk**: crisp, opaque, saturated lines with a slight hand wobble. Charming and a bit scruffy, like a bartender did it in ten minutes with good handwriting.

### Palette

| Token | Hex | Role |
|---|---|---|
| `--slate` | `#1E2220` | Board surface |
| `--slate-smudge` | `#2A2F2C` | Smudges, eraser residue |
| `--oak` | `#7A4E2D` | Board frame |
| `--brick-1` | `#7B3F2C` | Brick |
| `--brick-2` | `#8C4934` | Brick |
| `--brick-3` | `#86442F` | Brick |
| `--brick-4` | `#6F3727` | Brick |
| `--mortar` | `#3B2621` | Mortar |
| `--chalk` | `#F4F1EA` | Main lettering and lines (14.3:1 on slate) |
| `--wine` | `#FF2D78` | **Wine.** The word "wine" in questions and verdicts, wine in the glass doodles, the visitor's route on the reveal, the final node circle, the heading underline, focus rings (4.5:1 on slate) |
| `--crisps` | `#FFD84D` | **Bar patter.** Loading lines, crisp-packet and star doodles (11.6:1) |
| `--soda` | `#6FD3F2` | **Cheer.** "Great!" at the start of verdicts, and small doodles (9.4:1) |

**Colour rules:**

- **Only these three lettering colours plus chalk. No green or orange.**
- The colour tells you what kind of words you're reading: pink is wine, yellow is bar patter, blue is cheer. Everything else is chalk.
- Render the word "wine" in pink wherever it appears in question and verdict copy, by auto-wrapping it in a `<span>` at render time, so Helen's copy stays plain text in the YAML. "Great!" at the start of a verdict is auto-wrapped in blue the same way.
- `--wine` passes AA at 4.5:1, but only just. Use it for large text, lines and the word "wine" at display sizes, and never for small body copy.

**Brick wall:** the brick wall is a tiled SVG pattern (running bond, bricks about 50×24 px with about 3 px mortar). Use the four brick shades in an irregular-looking order so it doesn't read as a stamp. Keep it flat, with no gradients or shading. It fills the page behind the board.

### Typography (Google Fonts)

| Use | Font |
|---|---|
| "SHALL I DRINK WINE?" and "TODAY'S SPECIALS" only | **Fredericka the Great** |
| Verdict lines | **Caveat Brush**, large (about 44 px desktop) |
| Questions, answers, loading lines, small text | **Patrick Hand** |

Keep letter-spacing at the default. No per-letter wobble transforms; the wobble lives in the drawn lines, not the type. A double pink underline sits under the main heading.

### Layout

- **Desktop:** the framed board is centred on the brick wall, portrait-ish, sized to fit the viewport height, with plenty of brick visible around it.
- **Mobile:** the board fills most of the screen, with a band of brick visible around it. Use a 16 px side gutter and no horizontal scroll.
- Content inside the board is centred, with generous space around it. Show one question at a time and keep it big.

### Answer buttons — hand-circled, scribble on hover

This is a signature detail.

- Each answer is a real `<button>` with no CSS border. The text is in Patrick Hand at about 26 px.
- Behind each label sits an inline SVG of a **rough, rushed hand-drawn loop**: an ellipse that doesn't quite close and overshoots its start with a little tail, in chalk white, stroke about 2.5 px, round caps. The SVG stretches to fit the label (`preserveAspectRatio="none"` with `vector-effect="non-scaling-stroke"`).
- **Hover and focus state:** a **zigzag chalk scribble fills the loop**, as if someone coloured it in quickly. It's drawn in over about 0.4 s via `stroke-dashoffset`, at roughly 55% opacity so the label stays readable. Scribbles may overshoot the loop slightly; that's the charm.
- Scribble colour is a CSS variable, `--scribble`, defaulting to `--wine`. Helen may switch it to `--crisps` or `--soda`.
- **Variants:** make at least **3 loop variants and 3 scribble variants** and assign them randomly per button, so no two buttons on a screen look identical. Helen has her own SVGs to drop in later, so keep the variants as separate, easily swappable SVG partials or symbols (e.g. `_includes/loops/loop-1.svg`).
- `focus-visible` shows the scribble state. Never remove focus visibility.
- With reduced motion, the scribble appears instantly with no draw-in.
- The four `q3_why` answers stack vertically on mobile.

### SVG decorations

Hand-authored inline SVG doodles in chalk-pen style: stroke-based line art with round caps and joins, using **chalk, pink, yellow and blue only**. Suggested set:

- wine glass with pink wine (also used in the loading animation and the final node)
- bottle with a blue label
- bunch of grapes in pink
- crisp packet in yellow
- yellow stars
- a blue swirl
- arrows and double underlines for emphasis

Scatter a few around the board edges on each screen; the verdict screen gets the most. Keep them decorative (`aria-hidden="true"`). Everything is generic and original: no logos or brands. As with the buttons, keep doodles as separate SVG partials so Helen can swap in her own.

## 7. Accessibility and behaviour

- Fully keyboard operable. Move focus to the new question's heading on each screen change.
- Use an `aria-live` region for question changes and loading lines.
- Respect `prefers-reduced-motion` throughout (§4, §5, §6).
- Use semantic HTML: one `<h1>` per screen state, and buttons for answers.
- Works without layout shift from 320 px wide upwards.
- No JS fallback is needed beyond a short chalked `<noscript>` message.

## 8. Out of scope (for now)

- A share-your-route image
- A tally-marks counter
- Sound
- Multiple languages

## 9. Done means

- The site is live on GitHub Pages at the URL above.
- Every route has been clicked through and ends at the right verdict and the reveal.
- The validation script passes.
- The footer heart matches the rhubarb site exactly.
- The site looks right at 375 px and 1440 px wide.
- A short `README.md` explains how to edit `_data/pathway.yml`, including how to add a question and a loading line and how to adjust reveal positions, and how to swap in custom loop, scribble and doodle SVGs.
