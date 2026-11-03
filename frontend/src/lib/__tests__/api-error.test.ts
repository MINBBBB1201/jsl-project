import assert from "node:assert/strict"
import { test } from "node:test"
import { getApiErrorMessage } from "../api-error"

const fallback = "요청에 실패했습니다. (HTTP 500)"

for (const [status, message] of [
  [400, "Invalid JSON request body."],
  [403, "Request not allowed."],
  [404, "Route not found."],
  [413, "Request body is too large."],
  [500, "Something went wrong!"],
] as const) {
  test(`common public ${status} message is readable`, () => {
    assert.equal(
      getApiErrorMessage({ status: status < 500 ? "fail" : "error", message }, fallback),
      message,
    )
  })
}

test("legacy error keeps priority and its exact text", () => {
  assert.equal(getApiErrorMessage({
    error: " 기존 오류 ", errors: [{ msg: "validation" }], status: "fail", message: "common",
  }, fallback), " 기존 오류 ")
})

test("first legacy validation message keeps priority over common message", () => {
  assert.equal(getApiErrorMessage({
    errors: [{ msg: "입력값을 확인해 주세요." }], status: "fail", message: "common",
  }, fallback), "입력값을 확인해 주세요.")
})

test("a non-string error does not hide a valid validation message", () => {
  assert.equal(getApiErrorMessage({ error: { stack: "private fixture" }, errors: [{ msg: "validation" }] }, fallback), "validation")
})

test("malformed first validation error does not search unrelated later entries", () => {
  assert.equal(getApiErrorMessage({ errors: [null, { msg: "later" }], status: "fail", message: "common" }, fallback), "common")
})

for (const body of [null, undefined, [], "<html>gateway error</html>", 42, false]) {
  test(`invalid top-level body ${JSON.stringify(body)} uses fallback`, () => {
    assert.equal(getApiErrorMessage(body, fallback), fallback)
  })
}

for (const body of [
  {},
  { message: "unclassified diagnostic" },
  { status: "success", message: "success text" },
  { status: "fail", message: { stack: "private fixture" } },
  { status: "error", message: ["private fixture"] },
  { status: "fail", message: 400 },
  { status: "error", message: "   " },
  { error: "", errors: [{ msg: "\n" }], stack: "private fixture" },
  { error: { message: "private fixture" }, errors: "private fixture", stack: "private fixture" },
]) {
  test(`unusable error fields ${JSON.stringify(body)} use fallback`, () => {
    assert.equal(getApiErrorMessage(body, fallback), fallback)
  })
}

test("invalid legacy fields can fall through to a common public message", () => {
  assert.equal(getApiErrorMessage({ error: {}, errors: [null], status: "error", message: "Something went wrong!", stack: "private fixture" }, fallback), "Something went wrong!")
})
