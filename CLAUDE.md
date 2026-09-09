# CLAUDE.md — Musicmap

Guidance for Claude Code working in this repository.

---

## ⚠️ The VM is ephemeral. Commit and push often.

This project is developed in Claude Code cloud sessions. The container is
temporary and is reclaimed after inactivity or when the session ends. The
conversation history is restored; **the filesystem is not.** Uncommitted work is
gone permanently.

**GitHub is the only durable storage.** Push at every meaningful checkpoint — a
working change, a passing check, the end of a session. A local commit dies with
the container. Work in progress is still worth pushing; mark it `WIP:`.

Before ending a turn:

```bash
git status -sb          # tree clean? branch in sync with origin?
```

If that shows uncommitted changes or unpushed commits, you are not done.

## The project

**One self-contained `index.html`.** No build step, no dependencies, no bundler,
no framework. Open it in a browser and it runs. That constraint is the point, not
an accident of how it started — it is what lets the same file be a local file, a
published page, and something you can read end to end.

Everything else in the repo is prose about that file.

| Path | Contents |
|---|---|
| `index.html` | The app: corpus, force layout, canvas renderer, query language, editing |
| `tools/build-artifact.mjs` | Strips the document shell for the Artifact build |
| `README.md` | What it is and how to use it |
| `docs/FINDINGS.md` | Engineering log — techniques worth keeping, known limits |
| `docs/ROADMAP.md` | Where it stands and what is worth doing next |

## Working on it

- **Look at the rendered page before and after a visual change.** It is a canvas
  app; unit-testing a force layout tells you nothing about whether it reads. A
  headless screenshot at a desktop and a phone viewport catches almost everything
  that matters.
- **Check the corpus after touching it.** Referential integrity, no self-loops,
  no duplicate edge keys, and — the one that has actually broken twice — **one
  connected component.** An island in the graph defeats the whole premise.
- **Measure before optimising and after.** Both performance findings in
  `docs/FINDINGS.md` (the spatial grid, the render-blocking font request) came
  from measuring, and one of them was a 13-second stall nobody had noticed.
- **Facts get cut, not guessed.** Every edge in the shipped corpus is a
  documented credit. If a date or a credit is shaky, leave it out — a shorter
  accurate corpus beats a longer shaky one, and the tool's only value is that you
  can believe what it shows you.
- **Provenance is load-bearing.** `src` distinguishes `corpus`, `you` and
  `claude`. Anything that writes rows must set it honestly.

## Conventions

- The relationship vocabulary is small on purpose. **Add a relation rather than
  abusing a near-miss** — forcing a fact into `wrote` or `member` because nothing
  better exists makes the graph state something false. `inspired` exists for
  exactly that reason.
- Optional values are `null`, never a guess or a placeholder year.
- Non-obvious choices and anything a future change might undo get an entry in
  `docs/FINDINGS.md`.

## Settled decisions — do not re-litigate

Each of these was a real choice with a cost. Changing one is fine; changing it
because it looks arbitrary is not.

- **One self-contained `index.html`, no bundler.** A bundler would let the code
  split into modules and cost the thing its defining property: the same file is a
  local file, a Pages site, and something you can read straight through.
  `tools/build-artifact.mjs` is not a step towards one — it only removes a
  document shell, and nothing else may ever be added to it.
- **`index.html` is a complete HTML document.** It was once written for the
  Artifact wrapper and carried no doctype, charset or viewport meta, which meant
  quirks mode and a broken mobile layout anywhere else it was opened. The
  document shell is the canonical form; the Artifact build is the derived one.
- **Single visual world, no light theme.** A washed-out vaporwave is a
  contradiction. What would have been a light/dark switch is a mood switch
  between two dark palettes. Every colour is painted explicitly — including
  `body`'s background — so the page never inherits a host's ground.
- **The corpus ships in the page; edits live in an overlay.** Changes are rows
  keyed by entity id, merged over the baseline at build time — adding, editing
  and deleting are one mechanism, everything is revertable, and the file still
  works with no store attached. Do not migrate the baseline into the store.
- **Provenance is permanent.** `src` is `corpus`, `you` or `claude`, and it
  reaches the ring on the canvas, the changes list, the `src:` query key and the
  export. A generated fact must never be able to pass as a curated one.
- **Nothing Claude proposes is written without review.** The suggestion flow
  validates against the schema and then asks. Validation proves a row *fits*, not
  that it is *true* — the review list is the only thing standing in for truth.
- **Edges are one neutral colour; line style carries the relationship family.**
  Sixteen edge colours would encode nothing but themselves.
- **The layout switch has no default opinion.** Clusters throws away topology,
  Timeline throws away everything but the year, Web is an honest hairball. None
  of them is right enough to be the only one.

## Publishing

Two outputs, one source.

**GitHub Pages** — https://joshhambright.github.io/musicmap/ — serves the
repository root from `main`. Pushing to `main` is the deploy; there is nothing to
build and no workflow.

**Artifact** — https://claude.ai/code/artifact/07523ea7-c423-4cd3-80b7-6885b139f19f

Two things to know before republishing:

1. **Publish `dist/artifact.html`, not `index.html`**, after running
   `node tools/build-artifact.mjs` — and **pass that URL explicitly**. Publishing
   without the `url` creates a second, separate artifact rather than updating the
   live one.
2. **Capabilities must be restated when they change.** The page declares `db`,
   `downloads` and `sample`. Omitting `capabilities` on a redeploy carries the
   stored set forward; passing a non-empty object replaces it wholesale, so
   anything not restated is revoked.
