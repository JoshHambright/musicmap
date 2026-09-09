# Findings

An engineering log for [Musicmap](../README.md): what the build proved, the
techniques worth keeping, and what is still wrong with it. Kept separate from the
README because it is written for whoever changes the code next, not for someone
deciding whether to open the page.

## What it proves

| Claim | Verified how |
|---|---|
| A canvas force layout handles this scale with no library | 233 nodes, naive O(n²) repulsion, ~22k pairs/tick, 60fps |
| The graph opens composed, not as an exploding blob | 280 sim ticks run synchronously at boot before first paint |
| Filtering feels alive because the layout re-settles | The sim runs only over *visible* nodes; hiding a type re-forms the graph |
| A tiny query language beats a pile of dropdowns | `type: rel: year: deg: near:~N path:A->B`, ~70 lines of parser |
| Degrees of separation is the feature people actually want | BFS shortest path, rendered on the canvas and enumerated in the panel |
| Non-obvious links are the payoff | `Lead Belly → In the Pines → Kurt Cobain → Nirvana → Dave Grohl → Foo Fighters → Josh Freese → Nine Inch Nails → Trent Reznor` |
| It can be a *tracker*, not just a viewer | Additions persist to the artifact `db` capability, shared across viewers |

## Techniques worth keeping

**Simulate only what's visible.** `applyFilters()` sets `vis` on nodes and
edges; `tick()` iterates the visible subset. Filtering therefore *re-lays-out*
rather than just hiding, which is what makes a type toggle feel like an answer
instead of a subtraction.

**Two-pass edge drawing.** Ordinary edges first, highlighted ones second, so the
lit path always sits on top without sorting the array.

```js
for (const pass of [0, 1])
  for (const e of edges) { if ((pass === 1) !== hot) continue; /* … */ }
```

**Label budget by zoom and degree.** `thresh = k > 1.5 ? 0 : k > 0.9 ? 4 : 9` —
plus an always-on set for the selection, its neighbours and any active path.
Labels get a `--canvas-bg` backplate so they stay legible over edges.

**Repulsion runs on a grid, not on every pair.** Repulsion has a 300-unit
cutoff, so nodes are bucketed into 300-unit cells and each one only compares
against its 3×3 neighbourhood. Every unordered pair is still visited twice, once
from each end, so each visit applies the force to one node only — the same net
result as the symmetric all-pairs version, at near-linear cost. At 373 nodes the
naive loop was 69,000 pairs a tick; measured, a tick is 0.97 ms and a full draw
6.85 ms, so the whole frame is comfortably inside a 60 fps budget.

**A font stylesheet is render-blocking, and CDNs fail.** With Google Fonts
unreachable, `domInteractive` was **13,039 ms** — the page sat blank while a
stylesheet timed out. Loading it as `media="print" onload="this.media='all'"`
drops that to 389 ms under the identical failure, and `document.fonts.ready`
triggers one redraw so the canvas labels get re-measured with the real metrics
once they land. This was invisible until the corpus got big enough that boot time
was worth measuring at all.

**Node size is a world value but a screen measurement.** Radii feed the force
layout in world units, so they must live there — but drawing with them means a
zoomed-in node inflates into a blob and a zoomed-out one vanishes. The fix is one
line at the draw call:

```js
const drawR = (n) => Math.max(3 / S.k, Math.min(n.r, 26 / S.k));
```

Hit-testing and label placement use the same function, so what you can click is
always what you can see. This was invisible until the neon halos went on — at
2.5× the node radius, the zoom bug turned four selected nodes into four
overlapping discs.

**The atmosphere has to lose.** The first neon pass drew the grid at 0.42 alpha
and haloed all 233 nodes equally; the result was a pretty haze you could not read
a graph out of. Grid down to 0.26, scanlines to 0.34, halos to 0.10 alpha except
on lit nodes, edges brightened. The scenery reads as scenery in a still frame and
gets out of the way the moment you look for data.

**Labels are placed in screen space, and collisions are dropped.** Candidates are
sorted — selection, hover, path, neighbours, then by degree — and each is tested
against the rects already placed; a clash means the label is skipped, not
squeezed. World-space label sizing looks fine at the desktop's `k ≈ 1` and falls
apart at the `k ≈ 0.36` a phone opens at, where every neighbour name lands in the
same pile of plates. The same guard quietly improves the desktop hairball.

**Slider extremes mean "unbounded".** The year filter spans the era the corpus
lives in, not its literal min/max — a single 1870 traditional song would
otherwise waste 60% of the slider's travel. At either end the bound is dropped
entirely, so the outliers stay visible at rest.

This one has now been wrong twice, in opposite directions. First a hardcoded
1954 floor silently hid nine entities, including both ends of the best path in
the dataset. The fix computed the floor as `Math.min(1950, YMIN)` — which is
`1870` whenever the data reaches back past 1950, so the slider went right back to
spanning the full 153 years it was meant to avoid. It reads correctly and is
backwards; it took building the timeline, which draws the same bounds as a visible
axis, to notice. `Math.max` is the answer. A bound you cannot see is a bound you
cannot check.

**Overlay persistence, not seeded rows.** The corpus ships in the page as
content. The `db` capability holds only an *overlay* — added, edited and
tombstoned records keyed by id — merged over the baseline in `buildGraph()`.
Consequences: the file works offline with no store, published viewers get live
shared editing, and nothing races to seed a store on load.

## Known limits

- **The grid is uniform, not adaptive.** Fine while the layout stays spread
  out; a pathological clump would put everything in one cell and hand back the
  O(n²) cost. A quadtree would fix that and is not needed yet.
- **The corpus is still hand-curated, and one person's taste.** MusicBrainz has
  almost exactly this data model and would let a fact arrive with a citation
  attached, but this environment's network policy denies `musicbrainz.org` (403
  at the proxy on CONNECT), so it stayed out of reach. Widening the policy is the
  precondition for that work.
- **One shortest path.** BFS returns the first route it finds; ties are
  arbitrary and there is no "show me all paths of length 3".
- **No merge conflict handling.** Two people editing the same entity is
  last-writer-wins, like everything else in the store. Fine for a few people,
  wrong for a crowd.
- **Suggestions are unverified.** Validation checks that a row *fits the schema
  and is not a duplicate*, which is not the same as checking it is true. The
  review list is the verification step, and `src:claude` exists so you can always
  ask what you have not checked yet.
- **Import trusts the file's relationship vocabulary.** An unknown `rel` is
  skipped rather than mapped or created, so a graph built with different
  relationship names imports as entities with no connections.
- **The phone still opens on a hairball**, just a legible one. Below about 0.4
  zoom the graph is a texture, and the query language is how you actually get
  anywhere.
- **Web mode is still a hairball**, and always will be — that is what 233 nodes
  and 376 edges look like without an opinion imposed on them. Clusters and
  Timeline are that opinion. The query language is still how you find one
  specific thing.
- **The two reading layouts each hide something.** Clusters throws away the
  topology's shape; Timeline throws away everything except the year. Neither
  replaces Web, which is why the switch stays visible rather than picking a
  default for you.
