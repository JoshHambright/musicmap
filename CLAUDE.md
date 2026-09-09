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
| `README.md` | What it is and how to use it |
| `docs/FINDINGS.md` | Engineering log — techniques worth keeping, known limits |

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
