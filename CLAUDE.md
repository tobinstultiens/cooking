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
- Taxonomies `categories`, `time`, and `tags` are configured (`config.toml`) but largely
  unused in existing content — don't assume they're required.

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
