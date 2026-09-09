# Roadmap

Where this got to, and what is worth doing next. Ordered by how much each would
change what the tool can do, not by effort.

## Where it stands

Done and working: the corpus (373 entities, 576 relationships, one connected
component), three layouts, the query language, shortest-path search, filters,
full editing with provenance and revert, JSON import and export, a shared store
when published, Claude-assisted expansion with review, and a real mobile layout.

The engine is in good shape. **The corpus is the ceiling** — it is one person's
slice of one scene, and everything below is either a way to break that ceiling or
a way to get more out of what is there.

## 1. MusicBrainz as a second source

The biggest lever, and currently blocked.

MusicBrainz is free, open, and has almost exactly this data model: artists,
releases, recordings, places, and typed relationships including producer,
engineer and recorded-at. Importing from it would mean a fact arrives **with a
citation attached** rather than on somebody's say-so — which is the one thing
Claude-assisted expansion structurally cannot offer.

Two constraints shape the design:

- **The published page cannot call it.** The artifact sandbox blocks outbound
  fetch/XHR entirely. So this is an offline importer that generates JSON for the
  existing Import path, not a live integration.
- **The session that builds it needs network access to `musicbrainz.org`.** At
  the time of writing the development environment's network policy denied it
  (403 at the proxy on CONNECT). Widening that policy is the precondition.

Design sketch: a small Node script that walks out from seed artists, honours the
1 req/sec rate limit, maps MusicBrainz relationship types onto this vocabulary,
carries each row's MBID as its `note` or a new `ref` field, and emits a corpus
file. Provenance would gain a fourth value, `musicbrainz`.

## 2. Betweenness centrality

The **Most connected** list ranks by degree, which finds the busiest entities —
Nirvana, Kurt Cobain, Steve Albini. That is not the same as finding the entities
the graph would *fall apart* without. Josh Freese and Troy Van Leeuwen should
score far above their degree, because they are the only routes between otherwise
separate scenes, and the fact that the tool currently cannot say so is it failing
to state something true about its own data.

Brandes' algorithm is O(V·E) — about 215,000 operations here, fine to run on
demand and cache until the graph changes. Surface it as a second ranked list next
to the degree one, and as a `brokers` or `between:>N` query key.

## 3. Shareable views

Encode the whole view — query, filters, layout, selection, transform — into the
URL, so any state is a link. Then named saved views stored alongside the graph.
Turns the tool from something you explore alone into something you send someone
with a specific argument already framed.

Cheap, and probably the highest ratio of usefulness to work on this list.

## 4. Community detection

Label propagation or Louvain over the graph would surface scenes the entity-type
filter cannot see — the Olympia cluster, the Chicago cluster, the Sound City
lineage — as a fourth layout, or as a colour overlay on the existing ones.

## 5. Smaller things worth doing

- **All paths of length N**, not just one shortest route. The current path finder
  returns the first BFS result; ties are arbitrary and invisible.
- **Import cannot map an unknown relationship name** — it skips the edge. A graph
  built with a different vocabulary imports as entities with no connections.
- **Merge conflicts are last-writer-wins.** Fine for a few people editing, wrong
  for a crowd.
- **The uniform grid is not adaptive.** A pathological clump puts everything in
  one cell and hands back the O(n²) cost a quadtree would avoid.
- **Editing a corpus entity's name does not rewrite the ids that reference it** —
  it does not need to, because edges key on id, but import-by-name against an
  edited graph will resolve to the new name only.
