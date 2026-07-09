# Cooking site

A personal collection of recipes and cooking "templates" published as a Hugo static
site. This glossary pins down the terms used when talking about recipe content and the
ingredient scaler.

## Language

**Recipe**:
A single dish page under `content/` (e.g. `content/recipes/carnitas.md`). Free-form
Markdown with minimal front matter.
_Avoid_: entry, post

**Template**:
A parameterized "how to make X" guide under `content/templates/` (ramen, rice, stir-fry)
rather than a fixed recipe. Unrelated to Hugo layout templates.
_Avoid_: guide (when a specific dish is meant)

**Ingredients block**:
A fenced ` ```ingredients ` code block that is the single source Hugo renders a recipe's
ingredient list from, and which drives scaling and unit conversion. Opt-in per recipe.
_Avoid_: ingredient list (when the structured block specifically is meant)

**Ingredient line**:
One `amount | unit | item` entry inside an ingredients block.

**Scalable quantity**:
An ingredient line with both a numeric `amount` and a `unit`. It recomputes with serving
size and may convert between unit systems.

**Non-scalable ingredient**:
An ingredient line with empty `amount` and `unit` (e.g. `| | salt to taste`). Rendered
verbatim, never scaled or converted.

**Serving (base yield)**:
The integer `servings:` an ingredients block's amounts are written for; the divisor used
when scaling to a reader's chosen serving count.
_Avoid_: portion, size

**Unit system**:
Metric or Imperial — the reader-selected display mode for a recipe. Defaults to Metric.
_Avoid_: units (when the system specifically is meant)

**Dimension**:
Whether a unit measures weight, volume, or count. Conversion only happens within a
dimension (no volume↔weight); count units never convert.

**Tag**:
A flat Title-Case term from the controlled vocabulary in `data/recipetags.yaml`, drawn
from three axes (protein/base, cuisine, dietary/attribute). Dish type is deliberately not
a tag axis — section folders capture that.
