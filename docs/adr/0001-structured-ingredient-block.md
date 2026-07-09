# Structured ingredient block for scaling and unit conversion

Recipe ingredient quantities are written as free-form Markdown prose across mixed unit
systems and even languages (one recipe is entirely Dutch), so parsing them in the browser
to enable serving-size scaling and metric↔imperial conversion would silently mis-scale.

We instead adopt an opt-in, in-body fenced ` ```ingredients ` block whose lines are
`amount | unit | item` (with a leading `servings: N`). A Hugo codeblock render hook
(`layouts/_default/_markup/render-codeblock-ingredients.html`) turns the block into the
visible ingredient list plus Serves and Metric/Imperial controls, and a client-side
script (`static/recipe-scaler.js`) does the maths using unit metadata from
`data/units.yaml`. The block is the single source the list renders from — there is no
separate prose list to drift.

We deliberately do **not** parse ingredient prose. The sole prose exception is oven
**temperatures** in recipe steps, whose rigid `°F`/`°C` shape is safe to match with a
narrow regex and flip alongside the toggle.

Chosen over: front-matter data (splits the data from where it renders) and browser-side
inference over existing prose (unreliable). The cost is that each recipe must be
hand-migrated into the block; recipes without one render exactly as before, so migration
is incremental.
