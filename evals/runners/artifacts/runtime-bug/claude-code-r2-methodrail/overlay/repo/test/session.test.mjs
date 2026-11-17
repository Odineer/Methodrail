import { test } from "node:test";
import assert from "node:assert/strict";
import { landingPath } from "../src/session.js";

const NOW = 1_700_000_000_000;

test("no session or token goes to login", () => {
  assert.equal(landingPath(undefined, NOW), "/login");
  assert.equal(landingPath({}, NOW), "/login");
});

test("unexpired session reaches dashboard", () => {
  assert.equal(landingPath({ token: "t", expiresAt: NOW + 1 }, NOW), "/dashboard");
});

test("expired session goes to login", () => {
  assert.equal(landingPath({ token: "t", expiresAt: NOW - 1 }, NOW), "/login");
  assert.equal(landingPath({ token: "t", expiresAt: NOW }, NOW), "/login");
});

test("session without a valid expiry fails closed", () => {
  assert.equal(landingPath({ token: "t" }, NOW), "/login");
  assert.equal(landingPath({ token: "t", expiresAt: "soon" }, NOW), "/login");
});
