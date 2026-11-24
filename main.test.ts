import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const MAIN = fileURLToPath(new URL("./main.ts", import.meta.url));
const EXPECTED = "ChatGeppetto";

const run = (dir: string): void => {
  execFileSync(process.execPath, [MAIN, dir]);
};

const makeTempDir = (t: test.TestContext): string => {
  const dir = mkdtempSync(join(tmpdir(), "grandma-entry-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};

test("writes entry.txt to the directory argument", (t) => {
  const dir = makeTempDir(t);
  run(dir);
  assert.equal(readFileSync(join(dir, "entry.txt"), "utf8"), EXPECTED);
});

test("is deterministic across runs and directories", (t) => {
  const a = makeTempDir(t);
  const b = makeTempDir(t);
  run(a);
  run(b);
  run(a);
  const first = readFileSync(join(a, "entry.txt"));
  const second = readFileSync(join(b, "entry.txt"));
  assert.deepEqual(first, second);
});

test("is exactly one line: no newline or carriage return", (t) => {
  const dir = makeTempDir(t);
  run(dir);
  const text = readFileSync(join(dir, "entry.txt"), "utf8");
  assert.ok(text.length > 0);
  assert.equal(text.includes("\n"), false);
  assert.equal(text.includes("\r"), false);
});

test("is exactly one word: all letters, no whitespace or punctuation", (t) => {
  const dir = makeTempDir(t);
  run(dir);
  const text = readFileSync(join(dir, "entry.txt"), "utf8");
  assert.match(text, /^\p{L}+$/u);
});

test("is 1-30 Unicode characters and not only whitespace", (t) => {
  const dir = makeTempDir(t);
  run(dir);
  const text = readFileSync(join(dir, "entry.txt"), "utf8");
  const chars = [...text];
  assert.ok(chars.length >= 1 && chars.length <= 30);
  assert.ok(/\S/.test(text));
});
