# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A personal cooking site: a collection of recipes and cooking "templates" built as a
[Hugo](https://gohugo.io) static site using the vendored `hugo-geekdoc` theme
(`themes/hugo-geekdoc/`). Despite what `README.md` says, content is plain Markdown, not org mode.

All authored content lives in `content/`. Everything else (theme, config, CI) is scaffolding.

## Commands

Hugo is not committed; the pinned version is **0.163.3** (see `dockerfile`). Keep local Hugo
in sync with that pin — the vendored `hugo-geekdoc` theme (v4.1.1) requires Hugo ≥ 0.160, and an
older Hugo will fail to render.

```bash
hugo server            # live-reload dev server at http://localhost:1313
hugo server -D         # include draft pages (new archetype pages start with draft: true)
hugo                   # build static site into public/ (gitignored)
hugo new recipes/my-dish.md   # scaffold a page from archetypes/default.md
```

There are no tests, linters, or build steps beyond Hugo itself.

## Content structure

- Each top-level folder under `content/` (e.g. `recipes/`, `soup/`, `bbq/`, `templates/`,
  `ideas/`) is a section with an `_index.md` that renders its children via the
  `{{<toc-tree>}}` shortcode. **When adding a new section folder, it needs an `_index.md`
  with `{{<toc-tree>}}` or its pages won't be listed.**
- `content/templates/` holds parameterized "how to make X" guides (ramen, rice, stir-fry)
  rather than fixed recipes; `content/ideas/` holds untried/aspirational entries.
- Recipe pages use minimal front matter (usually just `title:`) followed by free-form
  Markdown. The house style is a `Serving:` line, then `Ingredients:` / sub-ingredient
  groups (`Sauce Ingredients:`, `Toppings:`) / `Steps:` as bulleted lists. Match the style
  of a neighboring file rather than inventing new front-matter fields.
- Taxonomies `categories` and `time` are configured (`config.toml`) but unused — don't
  assume they're required.
- **Recipes with images must be a page bundle.** Put the markdown as `index.md` in its own
  folder and keep the image files beside it; reference them with `{{< img name="..." >}}` plus
  matching `resources:` front matter (see `content/recipes/ala_mario/`). A plain `foo.md` file
  is *not* a bundle, so `.Page.Resources` is empty and `{{< img >}}` silently renders nothing.
  Don't duplicate images into `static/`.

## Ingredient scaling (```ingredients block)

- A recipe can *opt in* to serving-size scaling + metric/imperial conversion by writing its
  ingredient list as a fenced ` ```ingredients ` code block instead of prose bullets. The
  block is the single source the visible list renders from — don't also keep a prose list.
  Recipes without the block render exactly as before, so migration is incremental.
- Format: an optional first line `servings: N` (integer base yield), then one ingredient
  per line as `amount | unit | item`. Empty `amount` **and** `unit` (`| | salt to taste`)
  marks a non-scalable line rendered verbatim. `amount` accepts decimals or simple
  fractions (`1.5`, `1/3`, `1 1/2`); use a single value, not a range (put ranges in `item`).
  Author in whatever unit is natural — conversion is automatic. Example:

  ````
  ```ingredients
  servings: 8
  3 | lb | pork shoulder, cut into 2-inch cubes
  1/4 | cup | vegetable oil
  6 | clove | garlic
  | | salt to taste
  ```
  ````
- Units come from `data/units.yaml` (the single source: dimension, system, base factor,
  aliases). Base units are gram and millilitre. Unknown unit tokens are treated as
  dimensionless count labels (scale by number, shown verbatim), so `2 | onion | (diced)`
  works. Known count units (clove/piece, incl. Dutch aliases) pluralise automatically.
- The three moving parts (theme untouched): the codeblock render hook
  `layouts/_default/_markup/render-codeblock-ingredients.html` emits the list + controls
  and serialises the units to JSON; `static/recipe-scaler.{js,css}` (loaded globally via the
  overridden `layouts/partials/head/custom.html`) does scaling, cooking-friendly
  metric↔imperial rounding, and localStorage persistence (defaults to Metric). The scaler
  also flips oven **temperatures** in the Steps prose (°F↔°C) via a narrow temperature-only
  regex. See `docs/adr/0001-structured-ingredient-block.md` for the why.

## Tags

- Every recipe carries `tags:` drawn from a controlled, three-axis vocabulary defined in
  `data/recipetags.yaml` (the single source of truth): **protein/base** (Chicken, Beef, …),
  **cuisine** (Mexican, Japanese, …), and **dietary/attribute** (Spicy, Vegan, Quick, …).
  Dish type is intentionally *not* a tag axis — the section folders already capture it. Tags
  are flat Title-Case terms; a recipe typically gets 1 protein + 1 cuisine + 0–2 dietary.
  When adding a recipe, pick from the vocabulary (extend `data/recipetags.yaml` if genuinely
  needed). Pure reference/tips pages (e.g. `baking/general-tips.md`) may stay untagged.
- Tags drive three project-level overrides (theme is untouched): the `{{<recipe-filter>}}`
  shortcode (`layouts/shortcodes/recipe-filter.html`) renders clickable chips that filter
  recipes client-side. It is placed on the home `_index.md` (covers every recipe) and on each
  section `_index.md` above `{{<toc-tree>}}` (scopes to that section via
  `.Page.RegularPagesRecursive`, with chip counts local to the section); it self-hides on
  sections with fewer than 2 tagged recipes. Also, `layouts/partials/page-metadata.html` shows tag chips
  on every page linking to Hugo's `/tags/<name>` pages; and `assets/search/data.json` folds
  tags into the indexed search `content` so they're findable (the bundled flexsearch hardcodes
  its index fields, so tags can't be a separate search field).

## Rendering notes

- Geekdoc shortcodes available in `themes/hugo-geekdoc/layouts/shortcodes/` include
  `toc-tree`, `hint`, `columns`, `tabs`, `img`, `katex`, `mermaid`, `expand`.
- Goldmark `unsafe = true` is enabled (needed for mermaid), so raw HTML in Markdown renders.
- KaTeX and mermaid shortcodes are wired up for math/diagrams.

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds the multi-arch
Docker image from `dockerfile` (Hugo build → nginx) and pushes `kick1999/cooking:latest`
to Docker Hub. There is no preview/staging environment — merging to `master` publishes.
`config.toml` sets `geekdocRepo`/`geekdocEditPath` to the `tobinstultiens/cooking` master
branch for "Edit page" links.
