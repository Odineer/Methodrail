import { test } from "node:test";
import assert from "node:assert/strict";
import { landingPath } from "../src/session.js";

const NOW = 1_700_000_000_000;

test("expired session is sent to login", () => {
  assert.equal(landingPath({ token: "t", expiresAt: NOW - 1 }, NOW), "/login");
});

test("session expiring exactly now is sent to login", () => {
  assert.equal(landingPath({ token: "t", expiresAt: NOW }, NOW), "/login");
});

test("valid session reaches dashboard", () => {
  assert.equal(landingPath({ token: "t", expiresAt: NOW + 60_000 }, NOW), "/dashboard");
});

test("missing session or token is sent to login", () => {
  assert.equal(landingPath(null, NOW), "/login");
  assert.equal(landingPath({}, NOW), "/login");
});

test("session with unreadable expiry is sent to login", () => {
  assert.equal(landingPath({ token: "t", expiresAt: "garbage" }, NOW), "/login");
});
