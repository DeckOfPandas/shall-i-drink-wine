# Manual

Status, not history. Rewrite it when things change.

## What this is

The site in `shall-i-drink-wine-brief.md`: one page, a chalk-pen blackboard
on a brick wall, flowchart questions that always end in wine, and a Today's
Specials reveal. Jekyll with no plugins, `_data/pathway.yml` for every word,
`assets/js/main.js` for the flow, art as SVG files under `_includes/`. The
project kit (container, GitHub wrappers, Claude hooks and rules, kit tests)
is the same one as is-it-rhubarb-yet.

## Status

- The repo is `DeckOfPandas/shall-i-drink-wine`, renamed from
  `should-i-drink-wine`; the remote and `scripts/github.conf` both use the
  new name. The Pages URL is `/shall-i-drink-wine/`.
- All 9 routes click through to the right verdict and reveal, by mouse and
  by keyboard, with and without reduced motion. Checked in Chromium only, at
  375 and 1440 px wide.
- `scripts/validate-pathway.rb` passes and runs in the Pages workflow before
  the build. The workflow only runs on pushes to `main`, so a broken pathway
  is caught at deploy, not in the PR.
- The footer copies rhubarb's markup for the GitHub link, copyright,
  licence line and hearts, verbatim apart from the repo URLs. Rhubarb's data
  links are left out because the data pages don't exist here. `LICENSE` is
  rhubarb's MIT licence, word for word.
- Eight kit tests fail. The same eight fail in is-it-rhubarb-yet, so they
  came with the kit: Dockerfile defaults disagree with `kit.env`, a
  `settings.local.example.json` the tests expect is absent, and the wrappers
  test expects `github.conf` to still hold the placeholder.
- `_config.yml` leaves `baseurl` empty because the workflow supplies
  `--baseurl`. The brief says to set it; the workflow makes that unneeded.

## Decisions made without Helen, to check

- The `<noscript>` line is "This board needs JavaScript." The brief asks for
  one but gives no words. It is in `pathway.yml`.
- The 404 page reuses the old site's copy: "That page doesn't exist. You know
  what does?" and "Wine.", also in `pathway.yml`.
- The heading face draws a straight apostrophe as a speck, so headings show
  a curly one. The YAML keeps the straight one.
- No arrow on the reveal carries its answer's label. The board was too
  crowded with them.
- Question changes reach screen readers by moving focus to the new heading,
  not through the live region as well, which would read every question
  twice. Loading lines go through the live region.
- A loading screen comes after every answer, not between the landing and the
  first question.

## To do next

- Set Pages to "GitHub Actions" in the repository settings, if it isn't
  already, so the first merge to `main` deploys.
- Check the reveal on a real phone. Labels there are about 13 px; legible,
  not generous. The layout in `pathway.yml` is the lever.
- Check in Safari and Firefox. Nothing exotic is used, but SVG `pathLength`
  with `vector-effect` is the likeliest place for a browser to differ.
- Fix or delete the eight inherited kit tests.

## Out of scope, per the brief

Share-your-route image, tally counter, sound, other languages.
