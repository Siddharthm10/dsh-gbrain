/**
 * package.json "exports" hygiene guard.
 *
 * Node rejects an exports map whose subpath keys are not "." or start with
 * "./" — and it rejects the WHOLE package on load (even the "." main entry),
 * so one malformed key bricked the plugin on first rc.2 boot (2026-09-13:
 * keys "/config" "/gbrain" "/routes" "/client" made both the host entry and
 * the web client's "<pkg>/client" import throw ERR_MODULE_NOT_FOUND).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

test("exports is an object", () => {
  assert.equal(typeof pkg.exports, "object");
  assert.ok(pkg.exports !== null && !Array.isArray(pkg.exports));
});

test("every export key is a valid subpath (\".\" or starts with \"./\")", () => {
  for (const key of Object.keys(pkg.exports)) {
    assert.ok(
      key === "." || key.startsWith("./"),
      `invalid export subpath key ${JSON.stringify(key)} — must be "." or start with "./"`,
    );
  }
});

test("the web client subpath the DSH realm imports is declared", () => {
  // dsh-client-modules resolves a plugin's client half via "<id>/client".
  assert.ok("./client" in pkg.exports, "missing ./client subpath (web realm import)");
});

test("every export target exists on disk", () => {
  for (const [key, target] of Object.entries(pkg.exports)) {
    const file = typeof target === "string" ? target : target.default ?? target.import;
    assert.ok(typeof file === "string", `export ${JSON.stringify(key)} target is not a string`);
    assert.ok(
      existsSync(join(ROOT, file)),
      `export ${JSON.stringify(key)} points at missing file ${file}`,
    );
  }
});
