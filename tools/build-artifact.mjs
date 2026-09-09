#!/usr/bin/env node
/**
 * index.html is a complete HTML document, because that is what GitHub Pages and
 * a local file both need. The Artifact platform instead supplies its own
 * <head> and wants the page content on its own, so this lifts the region
 * between the APP markers back out into dist/artifact.html.
 *
 *   node tools/build-artifact.mjs
 *
 * There is deliberately no bundler here and there should never be one: the
 * whole point of the app is that it is one readable file with no build.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const BEGIN = /<!--\s*APP:BEGIN[\s\S]*?-->\n?/;
const END = /\n?<!--\s*APP:END\s*-->/;

const src = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = src.match(BEGIN);
const end = src.match(END);
if (!start || !end) {
  console.error("index.html is missing its APP:BEGIN / APP:END markers.");
  process.exit(1);
}
const app = src.slice(start.index + start[0].length, end.index).trim() + "\n";

/* Require the tag name to actually end, so <header> is not mistaken for <head>. */
for (const tag of ["html", "head", "body"]) {
  if (new RegExp(`<${tag}[\\s>]`, "i").test(app)) {
    console.error(`The app region still contains a <${tag}> tag; the Artifact wrapper supplies those.`);
    process.exit(1);
  }
}
if (/<!doctype/i.test(app)) {
  console.error("The app region still contains a doctype; the Artifact wrapper supplies one.");
  process.exit(1);
}
if (!/<title>/.test(app)) {
  console.error("The app region has no <title> — the Artifact would be named after its filename.");
  process.exit(1);
}

mkdirSync(new URL("../dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("../dist/artifact.html", import.meta.url), app);
console.log(`dist/artifact.html — ${(app.length / 1024).toFixed(0)} KB, ${app.split("\n").length} lines`);
