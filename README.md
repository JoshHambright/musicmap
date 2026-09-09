# Musicmap

**An interactive graph of who played on what, and where.** Musicians, bands,
albums, songs, studios, gear, tours and labels, with typed relationships between
them — filtered, queried, and searchable for the shortest route between any two
things.

**Live on GitHub Pages: https://joshhambright.github.io/musicmap/**
· also published as a [Claude Artifact](https://claude.ai/code/artifact/07523ea7-c423-4cd3-80b7-6885b139f19f)

The app is one self-contained `index.html` — a complete HTML document with no
build step, no dependencies, and no network calls except Google Fonts. **Open it
in any browser**, clone it, or serve the repo root as a static site; they are the
same file.

Running as an Artifact it also gets a shared store, file export, and the ability
to ask Claude to extend the graph. On Pages or as a local file those three stand
down cleanly — the page says so — and everything else works identically.

The premise is that the interesting connections in music are not the ones a
discography shows. They are the rooms, the producers and the session players:
*Rumours* and *Nevermind* came out of the same console, and Jimmy Iovine went
from engineering at Sound City to founding the label that released *Songs for
the Deaf*. This is a tool for finding that sort of thing.

---

## The corpus

373 entities, 576 typed relationships, one fully connected component — no
orphans, no self-loops, nothing unreachable. It is a curated slice of the
American underground → alternative web, roughly 1970–2009, chosen so that
**studios, producers and session players carry the interesting edges**: the ones
you cannot guess from a band's own line-up.

| Kind | Count | Kind | Count |
|---|---:|---|---:|
| People | 153 | Studios | 14 |
| Bands | 54 | Gear | 19 |
| Albums | 75 | Tours | 9 |
| Songs | 31 | Labels | 18 |

The second wave was picked for **density, not headcount**: every cluster lands on
a hub the corpus already had rather than floating beside it. The Melvins axis
(which is where Nirvana actually comes from), Olympia and Kill Rock Stars, Hole
and the Fort Apache pair, Dinosaur Jr, the Chicago/Louisville Albini side, 4AD
and Creation, Dischord — and Sound City's own back catalogue, which is the one
that pays off hardest: *Rumours* and *Damn the Torpedoes* came out of the same
room as *Nevermind*, and Jimmy Iovine went from engineering there to founding the
label that released *Songs for the Deaf*.

Two additions existed only to close islands. The Dischord and K Records clusters
were initially unreachable from the rest, which breaks the whole premise, so
each got a real bridge rather than an invented one: Bikini Kill's first EP, cut
at Inner Ear with Ian MacKaye producing, and the 1991 convention K Records ran in
Olympia. Connectivity is now checked, not assumed.

Sixteen relationship types, in three visual families:

- **solid** — structural: `member of`, `released`, `track`, `recorded at`, `played` (a tour)
- **dashed** — credit: `produced`, `engineered`, `mixed`, `played on`, `wrote`, `issued by`, `founded`
- **dotted** — gear and derivation: `plays`, `used on`, `covers`, `inspired`

`inspired` was added late, for facts that are real but are not credits: Kathleen
Hanna writing the phrase on Cobain's wall, Andrew Wood's death being why Temple
of the Dog exists. Before it existed those got forced into `wrote` and `member`,
where they read as false. A vocabulary that cannot say a true thing will make you
say a wrong one.

Edges are otherwise a single neutral colour. Line style encodes something true
about the relationship; a fifteen-hue edge palette would encode nothing but
itself.

The dataset is a demonstration corpus, not a claim to completeness. Everything in
it is a well-documented credit; where a fact was shaky it was cut rather than
guessed (several edges were removed during the build for exactly this reason).

## Three layouts

One simulation, three arrangements. The switch is in the left rail.

| Mode | What it does | What it is good for |
|---|---|---|
| **Web** | Plain force layout | Honest about the topology, and a hairball. Query your way around it. |
| **Clusters** | Each entity is pulled toward an anchor for its kind | Seeing what the corpus is *made of*, and which connections cross between kinds |
| **Timeline** | Horizontal position is the year; springs sort out the vertical | Seeing the era — the gear tail running back to the fifties, the mass piling up in 1988–1995 |

Two details make the timeline mean anything:

**People sit at their first credit, not their birth.** A person's `year` is a
birth year, which would strand them decades to the left of everything they made.
On the timeline every person takes the earliest year on any edge touching them,
so Johnny Cash enters this story in 1996 rather than 1932. Everything else keeps
its own date, because an album's year *is* its release.

**Crowding resolves vertically.** Repulsion and springs get their horizontal
component scaled to 0.14 in timeline mode, and the pull toward the year is raised
to 0.22, so entities form real year columns instead of drifting off their date.
It is the beeswarm trick, and without it the "timeline" is just a blob with an
axis drawn under it.

The domain is the visible dated range with a 4th-percentile floor, recomputed
whenever the filters change — so a couple of very old entries (a traditional song
dated 1870, a label founded in 1889) clamp to the left edge instead of squashing
seventy years of music into the right quarter of the screen.

## The query language

Terms are ANDed; a leading `-` negates; a bare word matches names.

```
type:album,song          entity kind, comma = or
rel:produced             participates in an edge of this kind
year:1991..1994          also year:>1990, year:<1980, year:1991
deg:>7                   connection count
src:claude               provenance - corpus, you, or claude
name:albini              substring on the name
near:"Steve Albini"~2    within N hops (default 1)
path:"Kurt Cobain"->"Josh Homme"    shortest route, drawn on the graph
```

`near:` and `path:` walk only the relationship types currently enabled in the
left rail, so turning off `issued by` stops routes tunnelling through record
labels — which is usually what you want, because a label connects everything to
everything.

## Growing the graph with Claude

The corpus is one person's slice of one scene. **Expand**, on any entity, asks
Claude for that entity's other connections *in this schema* and shows them as a
list you approve row by row. Nothing is written until you tick and keep. Searching
a name that isn't here offers the same thing, so you can start from a band you
care about rather than one I picked.

Three things make it a tool rather than a slot machine:

**The prompt hands over the graph, not just the name.** It sends the focus
entity, every connection already recorded for it (with "do not repeat these"),
the full list of entity kinds and relationships, and every name currently in the
graph with an instruction to reuse them character-for-character. That last part is
what stops a second "Sound City" appearing beside the first.

**Everything is validated before you see it.** In testing, six proposed edges came
back and two survived: one duplicated a fact already in the corpus, one pointed at
an entity that resolves to nothing, one invented a relationship name, one was a
self-loop. Proposed entities that no surviving edge references are dropped too, so
the review list has no orphans in it. What you approve is the intersection of what
Claude said and what the schema can actually hold.

**Provenance is permanent.** Anything kept is stamped `src: "claude"` — a dashed
ring on the graph, "suggested" in Your changes, `src:claude` as a query, a
`source` field in the export. A generated fact never quietly becomes a curated
one, and `src:corpus`, `src:you` and `src:claude` are three separately filterable
populations. Suggested rows are ordinary overlay rows otherwise: editable,
revertable, exportable.

Ticking an edge pulls in the entities it needs even if you left their rows
unticked — an edge without both ends is not a thing you can keep.

The page declares the `sample` capability; where it isn't granted, `claude.use`
returns null and the Expand control simply does not render.

## Editing, and getting data in and out

The corpus ships in the page as content; everything you change lives in an
**overlay** keyed by entity id, merged over that baseline at build time. One
mechanism covers three cases, which is why correcting a fact and inventing one
are the same operation:

| You do | The overlay holds | Undo |
|---|---|---|
| Add an entity or connection | a new row | drop the row |
| Edit one from the corpus | a row under the corpus id, which wins the merge | drop the row, and the original returns |
| Delete one from the corpus | a tombstone | drop the tombstone |

Every entity is editable, not just the ones you added — kind, name, year, note —
and while an entity is in edit mode each of its connections grows a × so wrong
edges can go too. **Your changes** in the Add tab lists every add, edit and
deletion with a one-click revert, and an undo-all. Nothing you do is destructive
to the corpus: the baseline is in the file, so the worst case is a stack of
overlay rows you can throw away.

**Where changes go depends on where the page is running.** As an Artifact they
land in a store shared with everyone who can open it. On GitHub Pages or as a
local file there is no store, so they last until you reload — the panel says so,
and Export is how you keep them. The corpus itself always ships in the file, so
there is nothing to lose by experimenting.

**Import** takes what Export writes — `{"nodes": […], "edges": […]}` — by file or
paste. Rows are resolved by id where one is given and by name otherwise, so an
export from a different copy still lands on the right entities. Rows identical to
the shipped corpus are counted and skipped rather than written: importing your own
export of 610 rows writes only the handful that are actually yours, instead of
minting 610 redundant documents against the store's 5,000-document quota. Bad
rows (no name, unknown kind, an endpoint that resolves to nothing) are skipped and
counted rather than failing the whole file.

## On a phone

The desktop layout does not survive a 390px screen, so below 820px it is a
different interface over the same engine:

- **The inspector is a bottom sheet**, not a side drawer. A 292px drawer over a
  390px screen hides the graph you just tapped, which defeats the point.
- **A tap shows a one-line peek** — kind, name, year, connection count — and the
  sheet opens only when you ask for it. Auto-opening a full-height panel on every
  tap makes exploring impossible.
- **Two rows in the header** below 700px: wordmark and controls, then the query
  field full width. As one row it overflowed the viewport, which pushed the Dim
  and Panel buttons off-screen entirely — the inspector was simply unreachable —
  and stretched the layout to 539px so `fit()` threw most of the graph outside
  the visible area. That was the actual bug; everything else here is comfort.
- **Pinch to zoom and two-finger pan**, tracked through the same pointer handlers
  as the mouse. `touch-action: none` on the canvas means the page hands us the
  gesture and we owe it an implementation.
- **Double-tap replaces double-click** to focus a node's two-hop neighbourhood;
  `dblclick` is unreliable on touch.
- **Touch gets a 20px catch radius** against the cursor's 6px, and hit-testing
  uses the same `drawR` clamp as rendering, so what you can tap is what you see.
- Bigger controls, `16px` on the query input so iOS does not zoom on focus, and
  `overscroll-behavior` pinned so the sheet does not drag the page.

## Visual direction

Vaporwave / cyberpunk, committed to rather than gestured at: a receding neon
plane with a horizon glow, cyan-and-magenta chromatic aberration on the
wordmark, CRT scanlines over the stage, and nodes drawn as glowing tubes.

**There is no light theme, on purpose.** A washed-out vaporwave is a
contradiction, so the page commits to one visual world and paints every colour
explicitly (including `body`'s background) rather than inheriting anything from
the host. What would have been a light/dark switch is instead a **mood switch**
between two dark palettes — NIGHT (indigo ground, cyan and violet) and SUNSET
(plum ground, magenta and orange) — which is a real choice in this idiom rather
than a concession to a convention that does not fit.

Type is the vaporwave/cyberpunk collision made literal: **Bodoni Moda**, a
high-contrast didone, wide-tracked in caps for the wordmark and entity names;
**Chakra Petch**, a techno face, for every control and label; **Share Tech Mono**
for data, years and the query bar. The didone is the "aesthetic" half, the
techno face is the cyberpunk half, and the tension between them is the point.

All of this is original work in the idiom — no reproduced logos, wordmarks or
assets.


---

## Deploying

GitHub Pages serves the repository root, so `index.html` is the site and there is
nothing to build. `.nojekyll` keeps Jekyll's hands off it.

The Artifact build is the one exception. The Artifact platform supplies its own
`<head>`, so it wants the page content without a document shell around it:

```bash
node tools/build-artifact.mjs     # -> dist/artifact.html
```

That lifts out the region between the `APP:BEGIN` / `APP:END` markers and refuses
to write a file that still carries a `<html>`, `<head>`, `<body>` or doctype. The
`<title>` and the font `<link>`s live *inside* that region on purpose: the HTML
parser processes both using its in-head rules wherever it finds them, so one copy
serves both builds.

## Origins

Musicmap started as a throwaway prototype inside another project, built under a
house rule that anything visual gets a working page before it gets a task. It
outgrew that, so it lives here now. The engineering log — techniques worth
keeping, and what is still wrong — is in [docs/FINDINGS.md](docs/FINDINGS.md).
