"use strict";

const assert = require("node:assert/strict");
const { test, before, after } = require("node:test");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { notice } = require("../backend/src/services/contact-inquiry.service");
const { checkPolicyFile } = require("./contact-policy-check.cjs");

const cli = path.join(__dirname, "contact-policy-check.cjs");
const languages = ["ko", "en", "zh", "vi"];
const sentinel = "SYNTHETIC_PRIVATE_VALUE_NOT_FOR_OPERATION";
let directory;
let sequence = 0;

before(() => { directory = fs.mkdtempSync(path.join(os.tmpdir(), "jsl-policy-check-")); });
after(() => { fs.rmSync(directory, { recursive: true, force: true }); });

function policy() {
  return {
    kind: "operational",
    approved: true,
    approvedBy: sentinel,
    noticeId: "synthetic-policy-test-only",
    effectiveDate: "2026-11-06",
    purpose: sentinel,
    items: ["contactName", "email", "message"],
    retentionDescription: sentinel,
    refusalConsequence: sentinel,
    privacyContact: sentinel,
  };
}
function policies() {
  return Object.fromEntries(languages.map((language) => [language, policy()]));
}
function write(value, raw = false) {
  const filename = path.join(directory, `synthetic-${++sequence}.json`);
  fs.writeFileSync(filename, raw ? value : JSON.stringify(value));
  return filename;
}
function run(args, extraEnv = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    timeout: 5000,
    env: { ...process.env, ...extraEnv },
  });
  assert.equal(result.error, undefined);
  assert.ok(!result.stdout.includes(sentinel));
  assert.ok(!result.stderr.includes(sentinel));
  return result;
}
function report(input) {
  const result = run(["--input", input]);
  return { ...result, report: JSON.parse(result.stdout) };
}

test("valid synthetic operational policies expose only readiness and API notice hashes", () => {
  const input = policies();
  const file = write(input);
  const original = fs.readFileSync(file);
  const modifiedAt = fs.statSync(file).mtimeMs;
  const result = report(file);
  assert.equal(result.status, 0);
  assert.equal(result.report.ready, true);
  assert.deepEqual(result.report.languages, languages.map((language) => ({
    language, ready: true, missing: [], noticeHash: notice(input[language]).noticeHash,
  })));
  assert.deepEqual(fs.readFileSync(file), original);
  assert.equal(fs.statSync(file).mtimeMs, modifiedAt);
  assert.ok(!result.stdout.includes(file));
});

test("missing explicit input never falls back to CONTACT_POLICY_PATH", () => {
  const input = write(policies());
  const result = run([], { CONTACT_POLICY_PATH: input });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.ok(!result.stderr.includes(input));
  assert.throws(() => checkPolicyFile(undefined), /Explicit input path/);
});

test("explicit invalid input cannot fall back to a valid environment policy", () => {
  const result = run(["--input", path.join(directory, "missing.json")], { CONTACT_POLICY_PATH: write(policies()) });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).ready, false);
  assert.ok(!result.stdout.includes(directory));
});

test("usage errors reject missing values, blank paths, unknown flags and extra inputs", () => {
  for (const args of [["--input"], ["--input", " "], ["--input", "--help"], ["--unknown", "file"], ["--input", "a", "b"]]) {
    const result = run(args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
  }
});

test("help does not load the environment policy", () => {
  const result = run(["--help"], { CONTACT_POLICY_PATH: write(sentinel, true) });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^Usage:/);
});

test("unapproved and fixture policies fail without printing values or hashes", () => {
  for (const overrides of [{ approved: false }, { kind: "fixture" }]) {
    const input = policies();
    input.en = { ...input.en, ...overrides };
    const result = report(write(input));
    assert.equal(result.status, 1);
    const en = result.report.languages.find((row) => row.language === "en");
    assert.equal(en.ready, false);
    assert.ok(en.missing.includes(overrides.kind ? "fixtureNotAllowed" : "approved"));
    assert.equal(en.noticeHash, undefined);
  }
});

test("one missing language fails the complete release check", () => {
  const input = policies();
  delete input.vi;
  const result = report(write(input));
  assert.equal(result.status, 1);
  assert.deepEqual(result.report.languages.find((row) => row.language === "vi"), {
    language: "vi", ready: false, missing: ["policy"],
  });
  assert.equal(result.report.languages.filter((row) => row.ready).length, 3);
});

test("malformed JSON and invalid root structures fail closed without echoing excerpts", () => {
  for (const input of [`{"${sentinel}":`, "null", "[]", JSON.stringify({ ...policies(), [sentinel]: policy() })]) {
    const result = report(write(input, true));
    assert.equal(result.status, 1);
    assert.ok(result.report.languages.every((row) => !row.ready && row.missing.includes("policy")));
  }
});

test("unreadable input represented by a directory fails closed without a filesystem error leak", () => {
  const result = report(directory);
  assert.equal(result.status, 1);
  assert.equal(result.report.ready, false);
  assert.ok(!result.stderr.includes(directory));
  assert.equal(result.stderr, "");
});

test("required disclosure fields, duplicate items and impossible dates use backend validation", () => {
  for (const [field, value] of [["approvedBy", ""], ["privacyContact", ""], ["items", ["contactName", "email"]], ["items", ["contactName", "email", "message", "message"]], ["effectiveDate", "2026-02-30"]]) {
    const input = policies();
    input.ko[field] = value;
    const result = report(write(input));
    assert.equal(result.status, 1);
    const ko = result.report.languages.find((row) => row.language === "ko");
    assert.ok(ko.missing.includes(field));
    assert.equal(ko.noticeHash, undefined);
  }
});

test("approval metadata does not change the public notice hash", () => {
  const input = policies();
  const first = report(write(input));
  input.en.approvedBy = "ANOTHER_SYNTHETIC_APPROVER";
  const second = report(write(input));
  assert.equal(second.status, 0);
  assert.equal(first.report.languages[1].noticeHash, second.report.languages[1].noticeHash);
  assert.ok(!second.stdout.includes("ANOTHER_SYNTHETIC_APPROVER"));
});
